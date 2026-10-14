# Neo Scrubber brand assets

Canonical copies from the Laravel app (`C:\sites\neo-scrubber`):

| File | Source | Use |
|------|--------|-----|
| `logo.png` | `public/images/logo.png` (copy as-is) | Wordmark + MD + tagline on transparent canvas (sidebar, auth, landing, emails) |
| `favicon.png` | `public/favicon.png` | Browser tab / PWA / square mark source |
| `mark.png` | Derived from `favicon.png` (512²) | Compact UI (collapsed sidebar) |

Import paths in code via `@/lib/brand` → `BRAND_ASSETS`.

`logo.png` is a transparent PNG that includes dark “MD” and “Evolving Healthcare Practices” text. Background cleanup must protect near-black text pixels (see `.superdesign/tmp/remove-logo-bg.js`) — never chroma-key all near-black. Do not apply invert/brightness filters.

Do not invent alternate logos; replace these files from Laravel when the brand updates.
