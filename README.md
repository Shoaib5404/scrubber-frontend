# Scrubber Frontend

Next.js App Router UI for Neo Scrubber. Sibling of [`scrubber-backend`](../scrubber-backend/README.md) under `C:\sites\Scrubber`.

The UI authenticates users, uploads EDI batches (via MinIO presigned URLs), and displays claim validation results. Authoritative auth, parsing, and scrubbing rules live on the Nest API.

## Technology stack

| Component | Implementation |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS 4, Radix / shadcn-style components |
| Forms / validation | react-hook-form, Zod |
| State | Zustand (session tokens) |
| Tables | TanStack Table |
| API types | `openapi-typescript` from backend OpenAPI JSON |
| Tests | Node test runner (unit), Playwright (e2e) |

## Prerequisites

- Node.js compatible with Next.js 16 (Node 20+ recommended)
- npm
- Running `scrubber-backend` on port **3011** (Compose + Nest) for a full local workflow

## Quick start

```bash
cp .env.example .env.local
npm install
npm run dev
```

- App: http://localhost:3010
- API base URL: http://localhost:3011/api/v1

Start the backend first. See [scrubber-backend/README.md](../scrubber-backend/README.md).

## Environment variables

Copy [`.env.example`](.env.example) to `.env.local`. Values are public (`NEXT_PUBLIC_*`) and must never hold secrets.

| Variable | Required? | Purpose | Example |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Yes | Nest API base (includes `/api/v1`) | `http://localhost:3011/api/v1` |
| `NEXT_PUBLIC_EMAIL_VERIFICATION_REQUIRED` | No | Soft-gate unverified users to `/verify-email` (mirror Nest `EMAIL_VERIFICATION_REQUIRED`) | `false` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | No | Mailto target for landing demo requests when not using the support API path | `sales@neomd.com` |

## Rules

- Do **not** put `DATABASE_*`, `REDIS_*`, or JWT secrets in frontend env.
- Only `NEXT_PUBLIC_API_URL` is required.
- Authoritative auth and claim validation live on the Nest API.
- Prefer `NEXT_PUBLIC_API_URL=http://127.0.0.1:3011/api/v1` when Playwright (or the app) uses a `127.0.0.1` base URL — `localhost` vs `127.0.0.1` can flake under e2e.
- Backend `CORS_ORIGINS` must include the UI origin (`http://localhost:3010` and/or `http://127.0.0.1:3010`).

## UI surface

Condensed staff/customer UI (not a 1:1 port of every legacy admin page):

| Area | Route pattern |
| --- | --- |
| Landing / contact | `/`, `/contact` |
| Auth | `/login`, forgot/reset password, verify-email, accept-invite, confirm-password |
| Customer portal | `/portal`, batches/claims, upload-logs, members, integrations, support, audit-logs |
| Staff dashboard | `/dashboard`, batches/claims, tenants, users, service-clients, permissions |
| Reference admin | `/dashboard/references` + `/dashboard/references/[domain]` |
| Support (staff) | `/dashboard/inquiries` |
| Audit | `/dashboard/audit-logs`, `/dashboard/audit-settings` |
| Coding | `/search`, `/cpt/[code]`, `/icd10-cm/...` |
| Profile | `/profile` |

Bulk Excel library imports are handled by Nest CLI; a few domains also support web import/export on the reference admin page.

Deeper feature notes:

- [docs/error-handling.md](docs/error-handling.md)
- [docs/support-inquiries.md](docs/support-inquiries.md)
- [docs/audit-logs.md](docs/audit-logs.md)
- [docs/design-system.md](docs/design-system.md)

## Architecture

```text
scrubber-frontend/
├── src/
│   ├── app/           # App Router pages and layouts
│   ├── components/    # Shared UI primitives
│   ├── hooks/
│   ├── lib/           # API client, auth tokens, datetime helpers
│   ├── modules/       # Feature modules (auth, batches, support, …)
│   └── types/         # Generated OpenAPI types (`api.d.ts`)
├── .env.example
├── package.json
└── README.md
```

## Backend API integration

- Base URL from `NEXT_PUBLIC_API_URL` via `src/lib/api/config.ts`.
- Authenticated calls attach `Authorization: Bearer <accessToken>` (`src/lib/api/client.ts`).
- Access token is held in memory; refresh token in `localStorage`. On HTTP 401 the client refreshes once and retries; failed refresh clears the session.
- EDI browser upload uses Nest `upload-url` → browser PUT to MinIO → Nest `complete` (see backend README).
- API contract: Swagger at http://localhost:3011/api/docs and OpenAPI JSON at [`../scrubber-backend/docs/openapi/openapi.json`](../scrubber-backend/docs/openapi/openapi.json).

Regenerate TypeScript types after backend OpenAPI changes:

```bash
# From scrubber-backend (when needed):
npm run openapi:export

# From scrubber-frontend:
npm run openapi:types
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Local UI on port 3010 |
| `npm run build` | Production build |
| `npm run start` | Serve production build on port 3010 |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test:unit` | Unit tests (Node test runner) |
| `npm run test:e2e` | Playwright e2e |
| `npm run openapi:types` | Regenerate `src/types/api.d.ts` from backend OpenAPI |

## Testing

- Unit: `npm run test:unit` (no backend required for the current datetime unit test).
- E2E: `npm run test:e2e` — needs a running stack (API + UI) and correct `NEXT_PUBLIC_API_URL` host matching (`localhost` vs `127.0.0.1`).

## Troubleshooting

| Symptom | Likely cause | What to check |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL is not configured` | Missing `.env.local` | Copy `.env.example` → `.env.local` and restart `npm run dev` |
| Network / CORS failures | API down or origin mismatch | Backend on :3011; `CORS_ORIGINS` includes UI origin |
| Login works then immediate logout | Refresh failing / host mismatch | Align API URL host with how you open the app; confirm Nest JWT secrets set |
| Presigned upload fails in browser | MinIO CORS or public endpoint | Backend `MINIO_API_CORS_ALLOW_ORIGIN`, `S3_PUBLIC_ENDPOINT` (see backend README) |
| Stale API types | OpenAPI not regenerated | Run backend `openapi:export`, then `npm run openapi:types` |

Do not disable CORS or expose JWT secrets in the frontend as a workaround.

## Production build

```bash
npm run build
npm run start
```

Set `NEXT_PUBLIC_API_URL` to the deployed API base (including `/api/v1`) at build time. Hosting/CI details are not documented here unless present in this repository.
