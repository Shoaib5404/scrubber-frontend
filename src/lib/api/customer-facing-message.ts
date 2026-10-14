/**
 * Strip ops / API-integration wording before showing free-form server text
 * in the customer portal (and web UI surfaces that should stay non-technical).
 *
 * Machine API clients still receive raw messages (endpoints, poll instructions).
 * This helper is display-only and must not alter request/response contracts.
 */

const OPS_LEAK_PATTERNS: RegExp[] = [
  /\bnpm\s+run\b/i,
  /\bnpx\s+/i,
  /\bnest-commander\b/i,
  /\/api\/v\d+\//i,
  /\bPOST\s+\/api\b/i,
  /\bGET\s+\/api\b/i,
  /\bPUT\s+\/api\b/i,
  /call this (same )?endpoint/i,
  /\bstart:worker\b/i,
  /\bstart:scheduler\b/i,
  /\bdocker(?:-|\s+)compose\b/i,
  /\bminio\b/i,
  /\bbullmq\b/i,
  /\bredis\b/i,
  /\bprisma\b/i,
];

const DEFAULT_FALLBACK =
  'Something went wrong. Please try again or contact support.';

export function looksLikeOpsFacingMessage(message: string): boolean {
  return OPS_LEAK_PATTERNS.some((pattern) => pattern.test(message));
}

export function sanitizeCustomerFacingMessage(
  message: string | null | undefined,
  fallback: string = DEFAULT_FALLBACK,
): string {
  const trimmed = message?.trim() ?? '';
  if (!trimmed) return fallback;
  if (!looksLikeOpsFacingMessage(trimmed)) return trimmed;

  if (/queue|worker|stall|pending jobs/i.test(trimmed)) {
    return 'Validation is taking longer than expected. Please try again later or contact support.';
  }
  if (/endpoint|\/api\//i.test(trimmed)) {
    return 'Validation is still running. This page will update when results are ready.';
  }
  return fallback;
}

/** Map known upload-log error types to portal-safe copy. */
export function sanitizeUploadLogError(row: {
  error_type?: string | null;
  error_message?: string | null;
}): string {
  const type = row.error_type?.trim() ?? '';
  if (type === 'queue_stall') {
    return 'Validation is taking longer than expected. Please contact support if this continues.';
  }
  return sanitizeCustomerFacingMessage(
    row.error_message ?? row.error_type,
    '—',
  );
}
