/**
 * Centralized API / network error normalization for the Next.js client.
 *
 * Compatibility:
 * - `ApiClientError.message` and `.title` remain the primary display fields
 *   used across auth forms, admin pages, and AsyncState.
 * - Additive optional fields (`code`, `fieldErrors`, `requestId`, `retryable`)
 *   do not break existing `instanceof ApiClientError` checks.
 */

export type ApiErrorPayload = {
  type?: string;
  title?: string;
  detail?: string;
  message?: string | string[];
  status?: number;
  statusCode?: number;
  code?: string;
  requestId?: string;
  errors?: Record<string, string[] | string>;
  /** Legacy / alternate upload failure envelope */
  success?: boolean;
  data?: unknown;
};

/** One structural finding from a rejected EDI upload (422, edi_syntax invalid). */
export type EdiStructuralIssue = {
  rule: string;
  severity: string;
  message: string;
};

export type NormalizedApiError = {
  statusCode?: number;
  code?: string;
  userMessage: string;
  fieldErrors?: Record<string, string[]>;
  requestId?: string;
  retryable: boolean;
  /** Raw candidate before sanitization (for deactivated-account detection). */
  rawMessage?: string;
  /**
   * Present only for an EDI structural rejection envelope.
   * Other 422s leave this unset so existing screens keep a single message.
   */
  ediStructuralIssues?: EdiStructuralIssue[];
};

const SAFE_MESSAGES = {
  unknown: 'Something went wrong. Please try again. If the issue continues, contact support.',
  network: 'We couldn\'t connect to the server. Check your connection and try again.',
  timeout: 'This request is taking longer than expected. Please try again.',
  server: 'Something went wrong while processing your request. Please try again.',
  unavailable: 'This service is temporarily unavailable. Please try again shortly.',
  unauthorized: 'Your session has expired. Please sign in again.',
  forbidden: "You don't have permission to perform this action.",
  notFound: "We couldn't find the requested record.",
  conflict:
    'This information conflicts with an existing record. Please review it and try again.',
  validation: 'Please check the highlighted fields and try again.',
  rateLimit: "You're making requests too quickly. Please wait a moment and try again.",
  payloadTooLarge:
    'This file or request is too large. Please reduce its size and try again.',
  upload: "We couldn't upload the file. Please try again.",
  emptyResponse: 'The server returned an empty response. Please try again.',
  invalidJson: 'The server returned an unexpected response. Please try again.',
} as const;

const TECHNICAL_PATTERNS: RegExp[] = [
  /^internal server error$/i,
  /^http exception$/i,
  /^bad gateway$/i,
  /^service unavailable$/i,
  /^gateway timeout$/i,
  /prisma/i,
  /queryfailederror/i,
  /econnrefused/i,
  /etimedout/i,
  /enotfound/i,
  /socket hang up/i,
  /failed to fetch/i,
  /networkerror when attempting to fetch resource/i,
  /load failed/i,
  /stack trace/i,
  /\bat\s+\S+\s+\([^)]+:\d+:\d+\)/i,
  /select\s+.+\s+from\s+/i,
  /insert\s+into\s+/i,
  /\bminio\b/i,
  /s3\.amazonaws/i,
  /x-amz-/i,
  /password\s*[=:]/i,
  /secret\s*[=:]/i,
  /access[_-]?key\s*[=:]/i,
  /private[_-]?key\s*[=:]/i,
  /bearer\s+[a-z0-9\-._~+/]+=*/i,
  /^error:\s/i,
  /^\d{3}\s/,
];

function isTechnicalMessage(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return TECHNICAL_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function messageForStatus(status?: number): string {
  switch (status) {
    case 400:
    case 422:
      return SAFE_MESSAGES.validation;
    case 401:
      return SAFE_MESSAGES.unauthorized;
    case 403:
      return SAFE_MESSAGES.forbidden;
    case 404:
      return SAFE_MESSAGES.notFound;
    case 409:
      return SAFE_MESSAGES.conflict;
    case 413:
      return SAFE_MESSAGES.payloadTooLarge;
    case 429:
      return SAFE_MESSAGES.rateLimit;
    case 502:
      return SAFE_MESSAGES.unavailable;
    case 503:
      return SAFE_MESSAGES.unavailable;
    case 504:
      return SAFE_MESSAGES.timeout;
    default:
      if (status !== undefined && status >= 500) {
        return SAFE_MESSAGES.server;
      }
      return SAFE_MESSAGES.unknown;
  }
}

function codeForStatus(status?: number): string | undefined {
  switch (status) {
    case 400:
      return 'VALIDATION_FAILED';
    case 401:
      return 'UNAUTHENTICATED';
    case 403:
      return 'ACCESS_DENIED';
    case 404:
      return 'RESOURCE_NOT_FOUND';
    case 409:
      return 'RESOURCE_CONFLICT';
    case 413:
      return 'PAYLOAD_TOO_LARGE';
    case 422:
      return 'UNPROCESSABLE_ENTITY';
    case 429:
      return 'RATE_LIMIT_EXCEEDED';
    case 502:
      return 'BAD_GATEWAY';
    case 503:
      return 'SERVICE_TEMPORARILY_UNAVAILABLE';
    case 504:
      return 'REQUEST_TIMEOUT';
    default:
      return status !== undefined && status >= 500
        ? 'INTERNAL_SERVER_ERROR'
        : undefined;
  }
}

function isRetryable(status?: number, code?: string): boolean {
  if (code === 'SERVICE_TEMPORARILY_UNAVAILABLE' || code === 'REQUEST_TIMEOUT') {
    return true;
  }
  return status === 503 || status === 504 || status === 429;
}

function extractCandidateMessage(payload: ApiErrorPayload, fallback: string): string {
  if (typeof payload.title === 'string' && payload.title.trim()) {
    return payload.title;
  }
  if (typeof payload.detail === 'string' && payload.detail.trim()) {
    return payload.detail;
  }
  if (Array.isArray(payload.message)) {
    return payload.message.map(String).join(', ');
  }
  if (typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message;
  }
  return fallback;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function mapStructuralIssue(value: unknown): EdiStructuralIssue | null {
  const record = asRecord(value);
  if (!record) return null;
  const message = typeof record.message === 'string' ? record.message.trim() : '';
  if (!message) return null;
  const ruleSource = record.rule ?? record.rule_id;
  const rule = typeof ruleSource === 'string' ? ruleSource.trim() : '';
  const severity = typeof record.severity === 'string' ? record.severity.trim() : 'error';
  return { rule, severity: severity || 'error', message };
}

/**
 * Read the structural issue list only from the EDI upload 422 envelope.
 * Returns undefined for every other error so callers that ignore this field are unchanged.
 */
export function extractEdiStructuralIssues(
  payload: ApiErrorPayload,
  status?: number,
): EdiStructuralIssue[] | undefined {
  if (status !== 422 || payload.success !== false) return undefined;
  const data = asRecord(payload.data);
  if (!data || data.edi_syntax !== 'invalid') return undefined;

  const raw = data.edi_validation_errors;
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(asRecord(raw)?.issues)
      ? (asRecord(raw)?.issues as unknown[])
      : null;
  if (!list) return undefined;

  const issues = list
    .map(mapStructuralIssue)
    .filter((issue): issue is EdiStructuralIssue => issue !== null);
  return issues.length > 0 ? issues : undefined;
}

function normalizeFieldErrors(
  errors: ApiErrorPayload['errors'],
): Record<string, string[]> | undefined {
  if (!errors || typeof errors !== 'object') return undefined;
  const result: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(errors)) {
    if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
      result[key] = value;
    } else if (typeof value === 'string') {
      result[key] = [value];
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

export function sanitizeUserMessage(
  candidate: string,
  status?: number,
): string {
  if (!isTechnicalMessage(candidate)) {
    // Never surface raw 5xx framework titles even when they look short.
    if (status !== undefined && status >= 500) {
      return messageForStatus(status);
    }
    return candidate.trim();
  }
  return messageForStatus(status);
}

export function normalizeApiErrorPayload(
  payload: ApiErrorPayload,
  options: { status?: number; statusText?: string } = {},
): NormalizedApiError {
  const status =
    options.status ??
    (typeof payload.status === 'number' ? payload.status : undefined) ??
    (typeof payload.statusCode === 'number' ? payload.statusCode : undefined);

  const fallback = options.statusText?.trim() || messageForStatus(status);
  const rawMessage = extractCandidateMessage(payload, fallback);
  const userMessage = sanitizeUserMessage(rawMessage, status);
  const code =
    typeof payload.code === 'string' && payload.code.trim()
      ? payload.code
      : codeForStatus(status);

  return {
    statusCode: status,
    code,
    userMessage,
    fieldErrors: normalizeFieldErrors(payload.errors),
    requestId:
      typeof payload.requestId === 'string' ? payload.requestId : undefined,
    retryable: isRetryable(status, code),
    rawMessage,
    ediStructuralIssues: extractEdiStructuralIssues(payload, status),
  };
}

export class ApiClientError extends Error {
  readonly status?: number;
  readonly title?: string;
  readonly code?: string;
  readonly fieldErrors?: Record<string, string[]>;
  readonly requestId?: string;
  readonly retryable: boolean;
  /** Unsanitized server candidate — used for deactivated-account detection. */
  readonly rawMessage?: string;
  /** EDI structural findings. Set only for that 422 envelope. */
  readonly ediStructuralIssues?: EdiStructuralIssue[];

  constructor(
    message: string,
    status?: number,
    title?: string,
    extras?: {
      code?: string;
      fieldErrors?: Record<string, string[]>;
      requestId?: string;
      retryable?: boolean;
      rawMessage?: string;
      ediStructuralIssues?: EdiStructuralIssue[];
    },
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.title = title ?? message;
    this.code = extras?.code;
    this.fieldErrors = extras?.fieldErrors;
    this.requestId = extras?.requestId;
    this.retryable = extras?.retryable ?? false;
    this.rawMessage = extras?.rawMessage;
    this.ediStructuralIssues = extras?.ediStructuralIssues;
  }

  static fromNormalized(normalized: NormalizedApiError): ApiClientError {
    return new ApiClientError(
      normalized.userMessage,
      normalized.statusCode,
      normalized.userMessage,
      {
        code: normalized.code,
        fieldErrors: normalized.fieldErrors,
        requestId: normalized.requestId,
        retryable: normalized.retryable,
        rawMessage: normalized.rawMessage,
        ediStructuralIssues: normalized.ediStructuralIssues,
      },
    );
  }
}

export function networkError(cause?: unknown): ApiClientError {
  const raw =
    cause instanceof Error && cause.name === 'AbortError'
      ? 'Request cancelled'
      : cause instanceof Error
        ? cause.message
        : undefined;

  // Abort/cancel is intentional — keep a clear, non-alarming message.
  if (cause instanceof Error && cause.name === 'AbortError') {
    return new ApiClientError('Request cancelled', 0, 'Request cancelled', {
      code: 'REQUEST_CANCELLED',
      retryable: false,
      rawMessage: raw,
    });
  }

  return new ApiClientError(SAFE_MESSAGES.network, undefined, SAFE_MESSAGES.network, {
    code: 'NETWORK_ERROR',
    retryable: true,
    rawMessage: raw,
  });
}

/** Preferred helper for UI layers (forms, AsyncState, admin pages). */
export function getUserFacingErrorMessage(
  error: unknown,
  fallback: string = SAFE_MESSAGES.unknown,
): string {
  if (error instanceof ApiClientError) {
    return error.title ?? error.message;
  }
  if (error instanceof Error) {
    return sanitizeUserMessage(error.message);
  }
  if (typeof error === 'string' && error.trim()) {
    return sanitizeUserMessage(error);
  }
  return fallback;
}

export { SAFE_MESSAGES as API_SAFE_MESSAGES };
