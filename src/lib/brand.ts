/**
 * Canonical Neo Scrubber brand asset paths (served from `/public/brand`).
 *
 * Source of truth (Laravel neo-scrubber):
 * - `public/images/logo.png` → wordmark
 * - `public/favicon.png` → square mark / favicon
 *
 * Import these constants anywhere you need a logo URL (UI, metadata, emails via absolute URL).
 */
export const BRAND_NAME = "Neo Scrubber" as const;
/** Short name used in browser tab titles: `Scrubber - <page>`. */
export const PAGE_TITLE_BRAND = "Scrubber" as const;
export const BRAND_MARK_ALT = "Neo MD" as const;

/** Format a browser document title as `Scrubber - <pageName>`. */
export function formatPageTitle(pageName: string): string {
  const trimmed = pageName.trim();
  if (!trimmed) return PAGE_TITLE_BRAND;
  return `${PAGE_TITLE_BRAND} - ${trimmed}`;
}

/** Public URL paths — use with `next/image`, `<img>`, or `${origin}${path}`. */
export const BRAND_ASSETS = {
  /** Horizontal wordmark (transparent PNG). */
  logo: "/brand/logo.png",
  /** Square brand mark derived from Laravel favicon. */
  mark: "/brand/mark.png",
  /** Original Laravel favicon (1024²). Prefer for browser tab / PWA. */
  favicon: "/brand/favicon.png",
} as const;

export type BrandAssetKey = keyof typeof BRAND_ASSETS;

export function brandAssetUrl(
  key: BrandAssetKey,
  origin?: string | null,
): string {
  const path = BRAND_ASSETS[key];
  if (!origin) return path;
  return `${origin.replace(/\/$/, "")}${path}`;
}
