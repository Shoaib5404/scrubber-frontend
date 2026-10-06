import { apiRequest } from '@/lib/api/client';
import type { AuthSession } from './types';

export async function loginRequest(
  email: string,
  password: string,
): Promise<AuthSession> {
  return apiRequest<AuthSession>(
    'POST',
    '/auth/login',
    { email, password },
    { skipAuth: true },
  );
}

export async function refreshRequest(refreshToken: string): Promise<AuthSession> {
  return apiRequest<AuthSession>(
    'POST',
    '/auth/refresh',
    { refreshToken },
    { skipAuth: true },
  );
}

export async function logoutRequest(refreshToken: string): Promise<void> {
  await apiRequest<void>(
    'POST',
    '/auth/logout',
    { refreshToken },
    { skipAuth: true },
  );
}
