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

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Local UI |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript |
| `npm run test:e2e` | Playwright smoke |
