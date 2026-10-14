import {
  ACCOUNT_DEACTIVATED_MESSAGE,
  AUTH_REASON_STORAGE_KEY,
} from '@/modules/auth/types';
import { refreshAccessToken } from '@/lib/auth/session-refresh';
import { tokenManager } from '@/lib/auth/token-manager';
import { getApiBaseUrl } from './config';
import {
  ApiClientError,
  networkError,
  normalizeApiErrorPayload,
  type ApiErrorPayload,
} from './errors';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ApiRequestOptions = {
  headers?: HeadersInit;
  signal?: AbortSignal;
  /** Skip Bearer attachment (public endpoints such as login). */
  skipAuth?: boolean;
};

function joinUrl(base: string, path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

function isAccountDeactivatedMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    message === ACCOUNT_DEACTIVATED_MESSAGE ||
    normalized.includes('account has been deactivated') ||
    normalized.includes('account is inactive')
  );
}

/**
 * Clear local session after auth is truly gone (refresh failed / deactivated).
 * Do not call for ordinary 403 Forbidden (permissions / features).
 */
function clearAuthSession(message: string): void {
  if (typeof window !== 'undefined' && isAccountDeactivatedMessage(message)) {
    try {
      sessionStorage.setItem(AUTH_REASON_STORAGE_KEY, 'deactivated');
    } catch {
      // ignore storage failures (private mode, etc.)
    }
  }
  tokenManager.clear();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('scrubber:auth-expired'));
  }
}

async function readNormalizedError(response: Response): Promise<ApiClientError> {
  let payload: ApiErrorPayload = {};
  try {
    payload = (await response.json()) as ApiErrorPayload;
  } catch {
    // Non-JSON bodies fall back to status text / safe defaults.
  }

  const normalized = normalizeApiErrorPayload(payload, {
    status: response.status,
    statusText: response.statusText,
  });

  return ApiClientError.fromNormalized(normalized);
}

async function parseSuccessBody<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text.trim()) {
    throw new ApiClientError(
      'The server returned an empty response. Please try again.',
      response.status,
      'The server returned an empty response. Please try again.',
      { code: 'EMPTY_RESPONSE' },
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiClientError(
      'The server returned an unexpected response. Please try again.',
      response.status,
      'The server returned an unexpected response. Please try again.',
      { code: 'INVALID_JSON_RESPONSE' },
    );
  }
}

async function executeFetch(
  method: HttpMethod,
  path: string,
  body: unknown | undefined,
  options: ApiRequestOptions,
): Promise<Response> {
  const headers = new Headers(options.headers);
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (!headers.has('Content-Type') && body !== undefined && !isFormData) {
    headers.set('Content-Type', 'application/json');
  }

  if (!options.skipAuth) {
    const accessToken = tokenManager.getAccessToken();
    if (accessToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  try {
    return await fetch(joinUrl(getApiBaseUrl(), path), {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : isFormData
            ? (body as FormData)
            : JSON.stringify(body),
      signal: options.signal,
    });
  } catch (error) {
    throw networkError(error);
  }
}

/**
 * On 401 for authenticated calls: refresh once (serialized), retry once.
 * On failed refresh: clear session. 403 does not clear session (except deactivated).
 */
async function handleFailedResponse(
  response: Response,
  options: ApiRequestOptions,
  alreadyRetried: boolean,
): Promise<'retry'> {
  const error = await readNormalizedError(response);
  const detectionMessage = error.rawMessage ?? error.title ?? error.message;

  if (response.status === 401 && !options.skipAuth && !alreadyRetried) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return 'retry';
    }
    clearAuthSession(detectionMessage);
    throw error;
  }

  if (response.status === 401 && !options.skipAuth && alreadyRetried) {
    clearAuthSession(detectionMessage);
    throw error;
  }

  // Public endpoints (login etc.): surface error, do not wipe tokens.
  // 403: permission/feature denial — keep session unless account deactivated.
  if (response.status === 403 && isAccountDeactivatedMessage(detectionMessage)) {
    clearAuthSession(detectionMessage);
  }

  throw error;
}

export async function apiRequest<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  options: ApiRequestOptions = {},
  alreadyRetried = false,
): Promise<T> {
  const response = await executeFetch(method, path, body, options);

  if (!response.ok) {
    const action = await handleFailedResponse(response, options, alreadyRetried);
    if (action === 'retry') {
      return apiRequest<T>(method, path, body, options, true);
    }
  }

  return parseSuccessBody<T>(response);
}

/** Like `apiRequest` but also returns the HTTP status (useful for 202 Accepted). */
export async function apiRequestWithMeta<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  options: ApiRequestOptions = {},
  alreadyRetried = false,
): Promise<{ status: number; data: T }> {
  const response = await executeFetch(method, path, body, options);

  if (!response.ok) {
    const action = await handleFailedResponse(response, options, alreadyRetried);
    if (action === 'retry') {
      return apiRequestWithMeta<T>(method, path, body, options, true);
    }
  }

  const data = await parseSuccessBody<T>(response);
  return { status: response.status, data };
}

/** Health lives outside /api/v1 prefix on the backend. */
export async function fetchApiHealth(): Promise<{ status: string }> {
  const apiBase = getApiBaseUrl();
  const origin = apiBase.replace(/\/api\/v1\/?$/, '');
  try {
    const response = await fetch(`${origin}/health`);
    if (!response.ok) {
      throw new ApiClientError(
        'API health check failed. Please try again.',
        response.status,
        'API health check failed. Please try again.',
      );
    }
    return (await response.json()) as { status: string };
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw networkError(error);
  }
}
