# Deploying Swat Clubs

Target: `https://clubs.sccs.swarthmore.edu`, following the same pattern as
planner and SwatGPT: the app runs via docker compose on `eagle`
(130.58.218.151), Traefik on `gull` terminates TLS and routes to it, and login
goes through SCCS Keycloak.

## Architecture

- `clubs-migrate` container: one-shot Prisma migration job. The web service
  starts only after it succeeds.
- `clubs` container: non-root, read-only Next.js 16 standalone app. It listens
  on eagle port **3001** (container port 3000), then seeds the club table from
  `lib/clubs.json` if it is empty.
- `clubs-db` container: Postgres 16, data in the named volume `clubs-dbdata`.
- `seaweedfs` container: private, single-node SeaweedFS object storage for club
  logos and feed photos. Its S3 endpoint is internal to Compose and its data is
  stored in the NFS-backed `clubs-seaweeddata` volume.
- `clubs-matcher` container: Go service for `/match`. Embeds club profiles via
  the TEI server on loon (`EMBEDDINGS_URL`, campus network only) and caches
  the vectors in the `ClubEmbedding` table. The app reaches it at
  `MATCHER_URL` (`http://clubs-matcher:8080` inside compose). If it or TEI is
  down, `/match` degrades to a friendly error; the rest of the site is
  unaffected.
- Auth: Auth.js (NextAuth v5) with Keycloak as the only provider. No local
  passwords. Membership in the configured Keycloak admin group grants
  administration automatically; existing administrators can also manage
  app-specific grants from **Admin → Users**. Users appear there after their
  first sign-in. Every club row records who created and last edited it
  (`createdBy`/`updatedBy` = display label and the corresponding `*Id` fields
  use the normalized Keycloak `preferred_username`, with subject fallback).

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
- `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY`: dedicated, randomly generated
  credentials shared only by the web app and the private SeaweedFS service
- `S3_REGION` / `S3_BUCKET_NAME`: optional storage settings; the defaults are
  `us-east-1` and `club-uploads`.
- `RATE_LIMIT_SECRET`: a separate random value (`openssl rand -hex 32`)
- `TRUST_PROXY_HEADERS=true`: safe only while the firewall restriction above
  prevents clients from bypassing Traefik
- `CLUB_VISIBILITY_GRACE_DAYS`: shared by the web and matcher services; keep the
  default of 14 unless the product rule changes
- `NSFW_PORN_THRESHOLD`, `NSFW_HENTAI_THRESHOLD`, `NSFW_SEXY_THRESHOLD`, and
  `NSFW_COMBINED_THRESHOLD`: optional NSFWJS review thresholds. Defaults are in
  `.env.example`; lower values send more images to administrator review.

Redeploy after a push to main: `git pull && docker compose up -d --build`.

Before the first deployment, verify eagle's firewall allows TCP 3001 from gull
and rejects it from every other source. Keep `TRUST_PROXY_HEADERS=false` until
that rule is active; anonymous rate limiting intentionally relies on the
trusted proxy's client-address header.

## SeaweedFS object storage

SeaweedFS runs its single-node `mini` profile and automatically creates
`S3_BUCKET_NAME`. It has no host port in production. Before a fresh deployment,
create the NFS export path `/volumes/clubs-seaweeddata`; Compose mounts it as
the `clubs-seaweeddata` volume.

The SeaweedFS and MinIO disk formats are unrelated. Never point SeaweedFS at
the old `clubs-miniodata` volume. If this installation already contains MinIO
objects, copy them through the two S3 APIs before removing the old container.
After pulling this change, leave the existing MinIO container running and
start only SeaweedFS:

```bash
docker compose up -d seaweedfs
```

Copy and verify every object with rclone. The old MinIO application credentials
already in `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY` need `List`, `Read`, and
`Write` access to the configured bucket:

```bash
docker run --rm --network clubs_default --env-file .env \
  --entrypoint /bin/sh \
  rclone/rclone:1.74.2 -c '
    set -eu
    export RCLONE_CONFIG_OLD_TYPE=s3
    export RCLONE_CONFIG_OLD_PROVIDER=Minio
    export RCLONE_CONFIG_OLD_ENDPOINT=http://minio:9000
    export RCLONE_CONFIG_OLD_ACCESS_KEY_ID="$S3_ACCESS_KEY_ID"
    export RCLONE_CONFIG_OLD_SECRET_ACCESS_KEY="$S3_SECRET_ACCESS_KEY"
    export RCLONE_CONFIG_NEW_TYPE=s3
    export RCLONE_CONFIG_NEW_PROVIDER=SeaweedFS
    export RCLONE_CONFIG_NEW_ENDPOINT=http://seaweedfs:8333
    export RCLONE_CONFIG_NEW_ACCESS_KEY_ID="$S3_ACCESS_KEY_ID"
    export RCLONE_CONFIG_NEW_SECRET_ACCESS_KEY="$S3_SECRET_ACCESS_KEY"
    rclone copy "old:$S3_BUCKET_NAME" "new:$S3_BUCKET_NAME" --progress
    rclone check "old:$S3_BUCKET_NAME" "new:$S3_BUCKET_NAME" --size-only
  '
```

Only after `rclone check` succeeds, start the full stack and remove the orphaned
MinIO container:

```bash
docker compose up -d --build --remove-orphans
```

Keep the old `clubs-miniodata` volume until the new service and backups have
been verified. Back up and test restoration of both Postgres and the
`clubs-seaweeddata` volume.

## Keycloak client (one-time, admin console)

At `https://auth.sccs.swarthmore.edu`, realm `master` (same realm the planner
and swatgpt clients live in), create a confidential OIDC client:

- Client ID: `clubs`
- Client authentication: on (confidential); standard flow only
- Valid redirect URIs: `https://clubs.sccs.swarthmore.edu/*`
  (the actual callback is `/api/auth/callback/keycloak`)
- Web origins: `https://clubs.sccs.swarthmore.edu`
- Include the `groups` and/or `ldap.groups` claims in the access token. Group
  names may be slash-prefixed. Configure the exact canonical group path in
  `KEYCLOAK_ADMIN_GROUP`; leaf-name matching is intentionally not used.
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
