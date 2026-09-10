# Deploying Swat Clubs

Target: `https://clubs.sccs.swarthmore.edu`, following the same pattern as
planner and SwatGPT: the app runs via docker compose on `eagle`
(130.58.218.151), Traefik on `gull` terminates TLS and routes to it, and login
goes through SCCS Keycloak.

## Architecture

- `clubs` container: Next.js 16 app, listens on eagle port **3001** (container
  port 3000). Runs `prisma migrate deploy` on boot, then seeds the club table
  from `lib/clubs.json` if it is empty.
- `clubs-db` container: Postgres 16, data in the named volume `clubs-dbdata`.
- `minio` container: private S3-compatible image storage for club logos and
  feed photos, with data in the NFS-backed `clubs-miniodata` volume.
- `clubs-matcher` container: Go service for `/match`. Embeds club profiles via
  the TEI server on loon (`EMBEDDINGS_URL`, campus network only) and caches
  the vectors in the `ClubEmbedding` table. The app reaches it at
  `MATCHER_URL` (`http://clubs-matcher:8080` inside compose). If it or TEI is
  down, `/match` degrades to a friendly error; the rest of the site is
  unaffected.
- Auth: Auth.js (NextAuth v5) with Keycloak as the only provider. No local
  accounts. Membership in the configured Keycloak admin group controls the
  request queue. Every club row records who created and last edited it
  (`createdBy`/`createdById`/`updatedBy`/`updatedById` = Keycloak name/subject).

## On eagle

```bash
git clone https://github.com/swat-sccs/clubs.git ~/clubs
cd ~/clubs
cp .env.example .env   # then fill in real values, see below
docker compose up -d --build
```

`.env` values:

- `POSTGRES_USER` / `POSTGRES_DB`: database identifiers; the example uses
  `clubs` for both
- `POSTGRES_PASSWORD`: random, `openssl rand -hex 24`; Compose uses these three
  values to construct `DATABASE_URL` inside the app and matcher containers
- `AUTH_SECRET`: `openssl rand -base64 32`
- `AUTH_URL`: `https://clubs.sccs.swarthmore.edu`, `AUTH_TRUST_HOST=true`
- `AUTH_KEYCLOAK_ID` / `AUTH_KEYCLOAK_SECRET` / `AUTH_KEYCLOAK_ISSUER`: see
  Keycloak below
- `KEYCLOAK_ADMIN_GROUP`: Keycloak group allowed to review requests; defaults
  to `sccs-staff`
- `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`: MinIO credentials. Use a long,
  random production password. The S3 endpoint is configured internally by Compose.
- `S3_REGION` / `S3_BUCKET_NAME`: optional storage settings; the defaults are
  `us-east-1` and `club-uploads`.
- `NSFW_PORN_THRESHOLD`, `NSFW_HENTAI_THRESHOLD`, `NSFW_SEXY_THRESHOLD`, and
  `NSFW_COMBINED_THRESHOLD`: optional NSFWJS review thresholds. Defaults are in
  `.env.example`; lower values send more images to administrator review.

Redeploy after a push to main: `git pull && docker compose up -d --build`.

## Keycloak client (one-time, admin console)

At `https://auth.sccs.swarthmore.edu`, realm `master` (same realm the planner
and swatgpt clients live in), create a confidential OIDC client:

- Client ID: `clubs`
- Client authentication: on (confidential); standard flow only
- Valid redirect URIs: `https://clubs.sccs.swarthmore.edu/*`
  (the actual callback is `/api/auth/callback/keycloak`)
- Web origins: `https://clubs.sccs.swarthmore.edu`
- Include the `groups` and/or `ldap.groups` claims in the access token. Group
  names may be slash-prefixed; nested group paths are supported.
- Copy the client secret into `.env` as `AUTH_KEYCLOAK_SECRET`, set
  `AUTH_KEYCLOAK_ID=clubs` and
  `AUTH_KEYCLOAK_ISSUER=https://auth.sccs.swarthmore.edu/realms/master`, then
  `docker compose up -d` to restart with the new env.

## Traefik on gull (one-time, needs sudo on gull)

Drop this file as `/srv/traefik/dynamic/clubs.yml` (the dynamic provider
watches the directory; no restart needed). Same shape as
`/srv/traefik/dynamic/swatgpt.yml`:

```yaml
http:
  routers:
    clubs:
      rule: Host(`clubs.sccs.swarthmore.edu`)
      entryPoints:
        - https
      tls:
        certResolver: letsEncrypt
      service: clubs
  services:
    clubs:
      loadBalancer:
        servers:
          - url: "http://130.58.218.151:3001"
```

## DNS (one-time, on tern)

Add `clubs.sccs.swarthmore.edu` as a CNAME to `gull.sccs.swarthmore.edu` in
the sccs.swarthmore.edu zone and bump the serial (same as the existing
`chat` and `plan` records).

## Local development

```bash
docker compose -f docker-compose.dev.yml up --build
```

Login against real SCCS Keycloak requires a redirect URI for
`http://localhost:3000/*` on the `clubs` client (or a separate `clubs-dev`
client); everything except `/clubs/new` works logged out.
