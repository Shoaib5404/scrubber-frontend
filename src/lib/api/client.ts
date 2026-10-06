import { getApiBaseUrl } from './config';
import { ApiClientError, networkError } from './errors';
import { tokenManager } from '@/lib/auth/token-manager';

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

export async function apiRequest<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (!options.skipAuth) {
    const accessToken = tokenManager.getAccessToken();
    if (accessToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  let response: Response;
  try {
    response = await fetch(joinUrl(getApiBaseUrl(), path), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: options.signal,
    });
  } catch (error) {
    throw networkError(error);
  }

  if (!response.ok) {
    let title = response.statusText;
    try {
      const payload = (await response.json()) as {
        title?: string;
        detail?: string;
        message?: string | string[];
      };
      if (payload.title) {
        title = payload.title;
      } else if (payload.detail) {
        title = payload.detail;
      } else if (Array.isArray(payload.message)) {
        title = payload.message.join(', ');
      } else if (typeof payload.message === 'string') {
        title = payload.message;
      }
    } catch {
      // ignore JSON parse errors
    }

    if (response.status === 401 || response.status === 403) {
      tokenManager.clear();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('scrubber:auth-expired'));
      }
    }

    throw new ApiClientError(title, response.status, title);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/** Health lives outside /api/v1 prefix on the backend. */
export async function fetchApiHealth(): Promise<{ status: string }> {
  const apiBase = getApiBaseUrl();
  const origin = apiBase.replace(/\/api\/v1\/?$/, '');
  const response = await fetch(`${origin}/health`);
  if (!response.ok) {
    throw new ApiClientError('Health check failed', response.status);
  }
  return (await response.json()) as { status: string };
}
