package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCosine(t *testing.T) {
	if got := cosine([]float64{1, 0}, []float64{1, 0}); got != 1 {
		t.Fatalf("cosine identical = %v, want 1", got)
	}
	if got := cosine([]float64{1}, []float64{1, 2}); got != 0 {
		t.Fatalf("cosine mismatched dimensions = %v, want 0", got)
	}
}

func TestHandleMatchRejectsUnsafeBodies(t *testing.T) {
	s := &server{matchSlots: make(chan struct{}, 1)}
	tests := []struct {
		name string
		body string
	}{
		{"unknown field", `{"query":"chess","extra":true}`},
		{"multiple values", `{"query":"chess"} {"query":"debate"}`},
		{"too long", `{"query":"` + strings.Repeat("x", maxQueryLen+1) + `"}`},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			request := httptest.NewRequest(http.MethodPost, "/match", strings.NewReader(tt.body))
			s.handleMatch(recorder, request)
			if recorder.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want %d", recorder.Code, http.StatusBadRequest)
			}
		})
	}
}

func TestHandleMatchShedsLoad(t *testing.T) {
	slots := make(chan struct{}, 1)
	slots <- struct{}{}
	s := &server{matchSlots: slots}
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/match", strings.NewReader(`{"query":"chess"}`))
	s.handleMatch(recorder, request)
	if recorder.Code != http.StatusTooManyRequests {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusTooManyRequests)
	}
}
