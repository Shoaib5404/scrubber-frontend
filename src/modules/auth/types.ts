export const STAFF_ROLES = ['super_admin', 'admin', 'user'] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export function isStaffRole(role: string | null | undefined): boolean {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role);
}

export function homePathForRole(role: string): string {
  return isStaffRole(role) ? '/dashboard' : '/portal';
}

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  role: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: AuthUser;
};
