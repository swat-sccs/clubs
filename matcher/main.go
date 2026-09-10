// Matcher is a small service that ranks clubs against a free-text description
// of a student's interests. It embeds club profiles and the query with the
// campus TEI server (gte-modernbert-base on loon) and ranks by cosine
// similarity. Club embeddings are cached in Postgres and refreshed lazily
// whenever a club row is newer than its embedding.
package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"os"
	"sort"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	embedModel     = "Alibaba-NLP/gte-modernbert-base"
	embedBatchSize = 32
	defaultLimit   = 8
	maxLimit       = 25
	maxQueryLen    = 2000
)

type server struct {
	db       *pgxpool.Pool
	embedURL string
	client   *http.Client
}

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is required")
	}
	embedURL := os.Getenv("EMBEDDINGS_URL")
	if embedURL == "" {
		log.Fatal("EMBEDDINGS_URL is required")
	}

	db, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("connect to postgres: %v", err)
	}
	defer db.Close()

	s := &server{
		db:       db,
		embedURL: strings.TrimRight(embedURL, "/"),
		client:   &http.Client{Timeout: 30 * time.Second},
	}

	mux := http.NewServeMux()
	mux.HandleFunc("POST /match", s.handleMatch)
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	addr := ":8080"
	log.Printf("matcher listening on %s (embeddings: %s)", addr, s.embedURL)
	log.Fatal(http.ListenAndServe(addr, mux))
}

type matchRequest struct {
	Query string `json:"query"`
	Limit int    `json:"limit"`
}

type match struct {
	ClubID string  `json:"clubId"`
	Name   string  `json:"name"`
	Score  float64 `json:"score"`
}

func (s *server) handleMatch(w http.ResponseWriter, r *http.Request) {
	var req matchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	req.Query = strings.TrimSpace(req.Query)
	if req.Query == "" || len(req.Query) > maxQueryLen {
		httpError(w, http.StatusBadRequest, "query must be 1-2000 characters")
		return
	}
	if req.Limit <= 0 {
		req.Limit = defaultLimit
	}
	if req.Limit > maxLimit {
		req.Limit = maxLimit
	}

	ctx := r.Context()
	if err := s.refreshEmbeddings(ctx); err != nil {
		log.Printf("refresh embeddings: %v", err)
		httpError(w, http.StatusBadGateway, "embedding backend unavailable")
		return
	}

	queryVecs, err := s.embed(ctx, []string{req.Query})
	if err != nil {
		log.Printf("embed query: %v", err)
		httpError(w, http.StatusBadGateway, "embedding backend unavailable")
		return
	}
	queryVec := queryVecs[0]

	rows, err := s.db.Query(ctx, `
		SELECT c."id", c."name", e."vector"
		FROM "ClubEmbedding" e
		JOIN "Club" c ON c."id" = e."clubId"
		WHERE c."createdAt" >= now() - interval '14 days'
		   OR EXISTS (
		       SELECT 1 FROM "ClubEditor" editor
		       WHERE editor."clubId" = c."id"
		   )`)
	if err != nil {
		log.Printf("load embeddings: %v", err)
		httpError(w, http.StatusInternalServerError, "database error")
		return
	}
	defer rows.Close()

	matches := make([]match, 0, 160)
	for rows.Next() {
		var m match
		var vec []float64
		if err := rows.Scan(&m.ClubID, &m.Name, &vec); err != nil {
			log.Printf("scan embedding: %v", err)
			httpError(w, http.StatusInternalServerError, "database error")
			return
		}
		m.Score = cosine(queryVec, vec)
		matches = append(matches, m)
	}
	sort.Slice(matches, func(i, j int) bool { return matches[i].Score > matches[j].Score })
	if len(matches) > req.Limit {
		matches = matches[:req.Limit]
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{"matches": matches})
}

// refreshEmbeddings embeds every club whose row is newer than its cached
// embedding (or has none). A no-op on the common path.
func (s *server) refreshEmbeddings(ctx context.Context) error {
	rows, err := s.db.Query(ctx, `
		SELECT c."id", c."name", c."description", c."tags"
		FROM "Club" c
		LEFT JOIN "ClubEmbedding" e ON e."clubId" = c."id"
		WHERE e."clubId" IS NULL OR e."updatedAt" < c."updatedAt"`)
	if err != nil {
		return fmt.Errorf("query stale clubs: %w", err)
	}
	type club struct {
		id, text string
	}
	stale := []club{}
	for rows.Next() {
		var id, name, description string
		var tags []string
		if err := rows.Scan(&id, &name, &description, &tags); err != nil {
			rows.Close()
			return fmt.Errorf("scan club: %w", err)
		}
		text := name + "\n" + strings.Join(tags, ", ") + "\n" + description
		stale = append(stale, club{id: id, text: text})
	}
	rows.Close()
	if len(stale) == 0 {
		return nil
	}
	log.Printf("embedding %d stale clubs", len(stale))

	for start := 0; start < len(stale); start += embedBatchSize {
		batch := stale[start:min(start+embedBatchSize, len(stale))]
		texts := make([]string, len(batch))
		for i, c := range batch {
			texts[i] = c.text
		}
		vecs, err := s.embed(ctx, texts)
		if err != nil {
			return fmt.Errorf("embed batch: %w", err)
		}
		batchDB := &pgx.Batch{}
		for i, c := range batch {
			batchDB.Queue(`
				INSERT INTO "ClubEmbedding" ("clubId", "model", "vector", "updatedAt")
				VALUES ($1, $2, $3, now())
				ON CONFLICT ("clubId")
				DO UPDATE SET "model" = $2, "vector" = $3, "updatedAt" = now()`,
				c.id, embedModel, vecs[i])
		}
		if err := s.db.SendBatch(ctx, batchDB).Close(); err != nil {
			return fmt.Errorf("store embeddings: %w", err)
		}
	}
	return nil
}

// embed calls TEI's OpenAI-compatible embeddings endpoint. Response order
// matches input order.
func (s *server) embed(ctx context.Context, texts []string) ([][]float64, error) {
	body, err := json.Marshal(map[string]any{"input": texts, "model": embedModel})
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		s.embedURL+"/v1/embeddings", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("TEI returned %s", resp.Status)
	}

	var parsed struct {
		Data []struct {
			Embedding []float64 `json:"embedding"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return nil, err
	}
	if len(parsed.Data) != len(texts) {
		return nil, fmt.Errorf("expected %d embeddings, got %d", len(texts), len(parsed.Data))
	}
	vecs := make([][]float64, len(parsed.Data))
	for i, d := range parsed.Data {
		vecs[i] = d.Embedding
	}
	return vecs, nil
}

func cosine(a, b []float64) float64 {
	if len(a) != len(b) || len(a) == 0 {
		return 0
	}
	var dot, normA, normB float64
	for i := range a {
		dot += a[i] * b[i]
		normA += a[i] * a[i]
		normB += b[i] * b[i]
	}
	if normA == 0 || normB == 0 {
		return 0
	}
	return dot / (math.Sqrt(normA) * math.Sqrt(normB))
}

func httpError(w http.ResponseWriter, code int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
