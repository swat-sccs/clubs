# Swat Clubs

The Swarthmore club directory: every club, team, publication, and society on
campus, searchable and filterable. The Activities Fair, open all year.

Built and run by [SCCS](https://sccs.swarthmore.edu). Live at
[clubs.sccs.swarthmore.edu](https://clubs.sccs.swarthmore.edu).

## What it does

- Browse and search all ~130 student organizations, filter by tag, council,
  size, membership process, and recruiting cycle. Bookmark the ones you like;
  bookmarks stay in your browser.
- Anyone with an SCCS account can add their club at `/clubs/new`. Login goes
  through SCCS Keycloak and nothing else; there are no passwords to manage
  here. Every club records who added it and who last touched it.

## Stack

Next.js 16 (App Router), React 19, Tailwind 4, Auth.js with Keycloak,
Prisma on Postgres 16. Bun for package management. Runs in Docker behind
SCCS's Traefik.

The club table is seeded once from `lib/clubs.json` on first boot against an
empty database, then the database is the source of truth. Deploys never
re-seed over user submissions.

## Development

You need [Bun](https://bun.sh) and Docker (for the dev database).

```bash
bun install
docker compose -f docker-compose.dev.yml up -d
cp .env.example .env.local
# set DATABASE_URL=postgresql://clubs:clubs@localhost:5432/clubs
bunx prisma migrate deploy
bun dev
```

That gives you the full site at [localhost:3000](http://localhost:3000) with
the directory seeded. Logging in locally requires access to the SCCS Keycloak
client (ask on the SCCS Slack, or see `DEPLOY.md`); everything except adding a
club works without it.

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
| `app/` | Routes: home, `/clubs`, `/clubs/new`, `/login`, `/faq` |
| `components/` | UI, including the filter rail (`Navbar`) and `ClubsExplorer` |
| `lib/clubs.ts` | Club types, tag/council constants, search index builders |
| `lib/data.ts` | Database reads |
| `app/clubs/new/actions.ts` | The server action that creates clubs |
| `prisma/` | Schema and migrations |
| `lib/clubs.json` | The original scraped directory, now just seed data |
