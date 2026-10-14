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
  tenant_id?: number | null;
  email_verified?: boolean;
  permissions?: string[];
  subscription_status?: string;
  subscription_active?: boolean;
  /** Staff-managed subscription feature codes (e.g. web.upload, api.access). */
  features?: string[];
};

export const TenantFeatureCode = {
  WebUpload: 'web.upload',
  ApiAccess: 'api.access',
  ApiBatches: 'api.batches',
  ApiReference: 'api.reference',
} as const;

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: AuthUser;
  warning?: string;
};

export const Permission = {
  DashboardView: 'dashboard.view',
  BatchesView: 'batches.view',
  BatchesUpload: 'batches.upload',
  DatasetsManage: 'datasets.manage',
  ArticlesManage: 'articles.manage',
  UsersManage: 'users.manage',
  TenantsManage: 'tenants.manage',
  AuditView: 'audit.view',
  InquiriesView: 'inquiries.view',
} as const;

export function hasPermission(
  user: AuthUser | null | undefined,
  permission: string,
): boolean {
  if (!user) {
    return false;
  }
  if (user.role === 'super_admin') {
    return true;
  }
  return (user.permissions ?? []).includes(permission);
}

export function canUploadOrValidate(user: AuthUser | null | undefined): boolean {
  if (!user) {
    return false;
  }
  if (isStaffRole(user.role)) {
    return true;
  }
  if (user.subscription_active === false) {
    return false;
  }
  const features = user.features;
  if (features == null) {
    // Legacy sessions without features field — treat as allowed until re-login.
    return true;
  }
  return features.includes(TenantFeatureCode.WebUpload);
}

export function hasTenantFeature(
  user: AuthUser | null | undefined,
  feature: string,
): boolean {
  if (!user) {
    return false;
  }
  if (isStaffRole(user.role)) {
    return true;
  }
  return (user.features ?? []).includes(feature);
}

export const SUBSCRIPTION_INACTIVE_MESSAGE =
  'Your subscription is not active. Upload and validation are unavailable. Please contact support to renew.';

/** Login inactive-account copy. */
export const ACCOUNT_DEACTIVATED_MESSAGE =
  'Your account has been deactivated.';

/** sessionStorage key used when mid-session auth fails due to deactivation. */
export const AUTH_REASON_STORAGE_KEY = 'scrubber:auth-reason';
