# Scrubber Frontend

Next.js App Router UI for Neo Scrubber. Sibling of `scrubber-backend` under `C:\sites\Scrubber`.

## Quick start

```bash
cp .env.example .env.local
npm install
npm run dev
```

- App: http://localhost:3010
- API (separate repo): http://localhost:3011/api/v1

## Rules

- Do **not** put `DATABASE_*`, `REDIS_*`, or JWT secrets in frontend env.
- Only `NEXT_PUBLIC_API_URL` is required.
- Authoritative auth and claim validation live on the Nest API.
- Prefer `NEXT_PUBLIC_API_URL=http://127.0.0.1:3011/api/v1` when Playwright (or the app) uses a `127.0.0.1` base URL — `localhost` vs `127.0.0.1` can flake under e2e.

## UI surface (vs Laravel Blade)

This app is a **condensed** staff/customer UI on purpose (migration gap **M4** / ruling **I9**):

| Area | Route pattern |
| --- | --- |
| Auth | `/login` |
| Customer portal | `/portal`, batches/claims, upload-logs |
| Staff batches/claims | `/dashboard`, `/dashboard/batches/[id]`, `/dashboard/claims/[id]` |
| Reference admin | `/dashboard/references` + `/dashboard/references/[domain]` (one generic CRUD) |
| Users / API clients | `/dashboard/users` |
| Upload logs | `/dashboard/upload-logs` |
| Coding | `/search`, `/cpt/[code]` |

We do **not** port hundreds of Blade CRUD pages 1:1. Nest CLI covers bulk Excel imports that Laravel exposed only as Artisan (and a few web import/export domains via the reference page).

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Local UI |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript |
| `npm run test:e2e` | Playwright smoke |
