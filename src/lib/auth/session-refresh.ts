import { getApiBaseUrl } from '@/lib/api/config';
import { tokenManager } from '@/lib/auth/token-manager';

const USER_KEY = 'scrubber.authUser';

type RefreshSessionBody = {
  accessToken?: string;
  refreshToken?: string;
  user?: unknown;
};

/** Single in-flight refresh so parallel 401s share one /auth/refresh call. */
let refreshInFlight: Promise<boolean> | null = null;

/**
 * Exchange the stored refresh token for a new access + refresh pair.
 * Uses raw fetch (not apiRequest) to avoid recursive 401 handling.
 */
export function refreshAccessToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function performRefresh(): Promise<boolean> {
  const refresh = tokenManager.getRefreshToken();
  if (!refresh) {
    return false;
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: refresh }),
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as RefreshSessionBody;
    if (!data.accessToken || !data.refreshToken) {
      return false;
    }

    tokenManager.setAccessToken(data.accessToken);
    tokenManager.setRefreshToken(data.refreshToken);

    if (data.user && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      } catch {
        // ignore storage failures
      }
      window.dispatchEvent(
        new CustomEvent('scrubber:auth-refreshed', { detail: data.user }),
      );
    }

    return true;
  } catch {
    return false;
  }
}
