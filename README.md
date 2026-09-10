# Swat Clubs

The Swarthmore club directory: every club, team, publication, and society on
campus, searchable and filterable. The Activities Fair, open all year.

Built and run by [SCCS](https://sccs.swarthmore.edu). Live at
[clubs.sccs.swarthmore.edu](https://clubs.sccs.swarthmore.edu).

## What it does

- Browse and search all ~130 student organizations, filter by tag,
  size, membership process, and recruiting cycle. Bookmark the ones you like;
  bookmarks stay in your browser.
- Anyone with an SCCS account can request a club at `/clubs/new` or claim an
  existing club page. SCCS administrators review both kinds of requests before
  a club is published or edit access is granted.
- `/match` takes a free-text description of what you're into and ranks clubs
  by cosine similarity between your text and each club's profile, embedded
  with `gte-modernbert-base` on SCCS's TEI server.

## Stack

Next.js 16 (App Router), React 19, Tailwind 4, Auth.js with Keycloak,
Prisma on Postgres 16. Club matching is a small Go service (`matcher/`) that
caches club embeddings in Postgres and ranks by cosine similarity. Bun for
package management. Runs in Docker behind SCCS's Traefik.

The club table is seeded once from `lib/clubs.json` on first boot against an
empty database, then the database is the source of truth. Deploys never
re-seed over user submissions.

## Development

You need Docker. The development compose stack runs both the frontend and
database.

```bash
docker compose -f docker-compose.dev.yml up --build
```

That gives you the full site at [localhost:3000](http://localhost:3000), with
hot reload enabled. The frontend automatically applies migrations and connects
to the compose database. Logging in locally requires access to the SCCS
Keycloak client (ask on the SCCS Slack, or see `DEPLOY.md`); browsing and
matching work without it.

Before opening a PR: `bun run lint` and `bun run build` should both pass.

### Changing the schema

Edit `prisma/schema.prisma`, then generate a migration and the client:

```bash
bunx prisma migrate dev --name what-you-changed
```

Migrations run automatically on deploy.

## Deployment

Docker compose on the SCCS `eagle` VM, routed through Traefik on `gull`.
`DEPLOY.md` has the full runbook: environment variables, the Keycloak client,
the Traefik route, and DNS.

## Repo tour

| Path | What's there |
| --- | --- |
| `app/` | Public club routes plus creation, claim, edit, “My clubs,” and admin workflows |
| `matcher/` | Go service: embeds clubs via TEI, serves cosine-ranked matches |
| `components/` | UI, including the filter rail (`Navbar`) and `ClubsExplorer` |
| `lib/clubs.ts` | Club types, profile constants, search index builders |
| `lib/data.ts` | Database reads |
| `app/admin/requests/` | Admin review queue and moderation actions |
| `prisma/` | Schema and migrations |
| `lib/clubs.json` | The original scraped directory, now just seed data |
