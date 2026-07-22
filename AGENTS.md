# AGENTS

## Repo shape (no workspace runner)
- This repo has 3 independent Node projects: `api/` (Next.js API), `app/` (Next.js frontend), `admin/` (Express + Pug). Run `npm` commands inside each directory.
- There is no root `package.json` and no CI workflow checked in; use package-local scripts and local verification.

## Service wiring you need to know
- `api/` uses Next.js **Pages Router** API routes under `api/pages/api/**`.
- `app/` also uses Pages Router; it does SSR redirect in `app/pages/[urlShort].tsx` by calling the API service (not the DB directly).
- `admin/` renders server-side Pug views and calls API endpoints with a bearer token from env.
- API auth is enforced in `api/proxy.ts` for `/api/:path*` except `/api/urlShort/*`, `/api/urlLong/new`, and `/api/health`.

## Database and compose gotchas
- Local API/app/admin development expects Postgres running from the root compose files.
- For local DB work with Prisma dev commands, start DB with all 3 files:
  - `docker compose -f compose.yaml -f compose.override.yaml -f compose.override.db.yaml --env-file ./.env up db -d --remove-orphans`
- `compose.override.db.yaml` intentionally disables `init-user-db.sh` so `prisma migrate dev` can use shadow DB behavior.
- Full local stack (db + prisma + api + app + admin):
  - `docker network create dokploy-network`
  - `docker compose -f compose.yaml -f compose.override.yaml --env-file ./.env up -d --build --remove-orphans`

## Critical command order
- `api/` first-time setup after `npm install`: run `npm run prismagenerate`, then `npm run prismadbpush`, then `npm run dev`.
- After schema changes in `api/prisma/schema.prisma`: run `npm run prismagenerate`; for local DB evolution use `npm run prismamigratedev`.
- `admin/` production/start path runs `index.js`; rebuild it from `index.ts` with `npm run build` before `npm run start` if TS changed.

## Fast verification targets
- API lint: `cd api && npx eslint .`
- API focused test spec: `cd api && npx cypress run --spec cypress/e2e/api/newUrlLong.cy.js`
- App lint: `cd app && npm run lint`
- Admin lint: `cd admin && npm run lint`

## Test safety and env assumptions
- `api` Cypress tests execute SQL tasks against local Postgres and truncate tables (see `api/cypress/e2e/api/newUrlLong.cy.js`); do not run against data you care about.
- `api/cypress.config.js` loads `.env.development.local` and connects to DB on `localhost` using app DB credentials.
- `api` and `admin` start scripts load `.env.development.local` via `dotenv-cli`; keep API/admin bearer token values aligned.
