# CleanRep

Webcam-based pushup counter and form validator. This README covers running the
project locally.

## Prerequisites

- Node.js >= 20
- pnpm 9 (`corepack enable && corepack prepare pnpm@9 --activate`)
- Docker (for Postgres in local dev)

## Quickstart

```bash
cp .env.example .env
docker compose up -d
pnpm install
pnpm dev
```

- Web: http://localhost:5173
- API: http://localhost:3000 (health: `/api/v1/health`)

To confirm Postgres connectivity once dependencies are installed:

```bash
pnpm --filter @cleanrep/api exec prisma db push
```

(The Prisma schema is empty in M0 — models land with auth in M4.)

## Scripts

| Command            | What it does                              |
| ------------------ | ----------------------------------------- |
| `pnpm dev`         | Run web + api in parallel                 |
| `pnpm typecheck`   | TypeScript checks across all workspaces   |
| `pnpm lint`        | ESLint across the repo                    |
| `pnpm test`        | Vitest across all workspaces              |
| `pnpm format`      | Prettier write                            |

## Layout

```
apps/
  web/        Vite + React + TS
  api/        Express + TS + Prisma
packages/
  shared/     Shared TypeScript types
```
