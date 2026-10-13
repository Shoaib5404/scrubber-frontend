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

export type ForgotPasswordResult = {
  success: boolean;
  message: string;
  reset_url?: string;
};

export async function forgotPasswordRequest(email: string): Promise<ForgotPasswordResult> {
  return apiRequest<ForgotPasswordResult>(
    'POST',
    '/auth/forgot-password',
    { email },
    { skipAuth: true },
  );
}

export async function resetPasswordRequest(input: {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>(
    'POST',
    '/auth/reset-password',
    input,
    { skipAuth: true },
  );
}

export async function acceptInviteRequest(input: {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>(
    'POST',
    '/auth/accept-invite',
    input,
    { skipAuth: true },
  );
}

export type VerifyEmailResult = {
  success: boolean;
  message: string;
};

export async function verifyEmailRequest(input: {
  id: number;
  hash: string;
  expires: number;
  signature: string;
}): Promise<VerifyEmailResult> {
  return apiRequest<VerifyEmailResult>('POST', '/auth/email/verify', input, {
    skipAuth: true,
  });
}

export type SendVerificationResult = {
  success: boolean;
  message: string;
  verification_url?: string;
};

export async function sendVerificationRequest(): Promise<SendVerificationResult> {
  return apiRequest<SendVerificationResult>(
    'POST',
    '/auth/email/verification-notification',
  );
}

export type ConfirmPasswordResult = {
  success: boolean;
  message: string;
  password_confirmed_token: string;
  expires_in: number;
  password_confirmed_at: string;
};

export async function confirmPasswordRequest(
  password: string,
): Promise<ConfirmPasswordResult> {
  return apiRequest<ConfirmPasswordResult>('POST', '/auth/confirm-password', {
    password,
  });
}

export type ProfileResult = {
  id: number;
  email: string;
  name: string;
  role: string;
  email_verified: boolean;
};

export async function getProfileRequest(): Promise<ProfileResult> {
  return apiRequest<ProfileResult>('GET', '/auth/profile');
}

export async function updateProfileRequest(name: string): Promise<ProfileResult> {
  return apiRequest<ProfileResult>('PATCH', '/auth/profile', { name });
}

export async function updatePasswordRequest(input: {
  current_password: string;
  password: string;
  password_confirmation: string;
}): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>(
    'PUT',
    '/auth/password',
    input,
  );
}

export async function deleteProfileRequest(
  password: string,
): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>(
    'DELETE',
    '/auth/profile',
    { password },
  );
}
