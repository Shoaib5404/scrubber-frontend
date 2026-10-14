# Neo Scrubber brand assets

Canonical copies from the Laravel app (`C:\sites\neo-scrubber`):

| File | Source | Use |
|------|--------|-----|
| `logo.png` | `public/images/logo.png` | Wordmark (sidebar, auth, landing, emails) |
| `favicon.png` | `public/favicon.png` | Browser tab / PWA / square mark source |
| `mark.png` | Derived from `favicon.png` (512²) | Compact UI (collapsed sidebar) |

Import paths in code via `@/lib/brand` → `BRAND_ASSETS`.

Do not invent alternate logos; replace these files from Laravel when the brand updates.
