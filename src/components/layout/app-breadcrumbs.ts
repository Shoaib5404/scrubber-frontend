export type AppBreadcrumb = {
  label: string;
  href?: string;
};

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  portal: 'Dashboard',
  batches: 'Batches',
  claims: 'Claims',
  'upload-logs': 'Upload logs',
  'audit-logs': 'Audit logs',
  'audit-settings': 'Audit settings',
  references: 'References',
  users: 'Users',
  tenants: 'Tenants',
  'service-clients': 'Service clients',
  permissions: 'Permissions',
  members: 'Members',
  integrations: 'Integrations',
  search: 'Coding search',
  'icd10-cm': 'ICD-10-CM',
  cpt: 'CPT',
  profile: 'Profile',
  articles: 'Articles',
  new: 'New',
  edit: 'Edit',
  'api-clients': 'API clients',
};

function looksDynamic(segment: string): boolean {
  if (SEGMENT_LABELS[segment]) return false;
  if (/^\d+$/.test(segment)) return true;
  // UUID / ULID-style identifiers
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      segment,
    )
  ) {
    return true;
  }
  if (/^[0-9a-f]{24,}$/i.test(segment)) return true;
  if (/^[a-z0-9_-]{16,}$/i.test(segment)) return true;
  return false;
}

function humanize(segment: string): string {
  return segment
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Build header breadcrumbs from the current path.
 * The final crumb always uses the page `title` so screens stay the source of truth.
 */
export function buildAppBreadcrumbs(
  pathname: string,
  basePath: '/dashboard' | '/portal',
  title: string,
): AppBreadcrumb[] {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: AppBreadcrumb[] = [];

  const isExternalTool =
    segments[0] === 'search' ||
    segments[0] === 'icd10-cm' ||
    segments[0] === 'cpt' ||
    segments[0] === 'profile';

  if (isExternalTool) {
    crumbs.push({ label: 'Dashboard', href: basePath });
  }

  let acc = '';
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;
    acc += `/${seg}`;
    const isLast = i === segments.length - 1;

    if (isLast) {
      crumbs.push({ label: title });
      break;
    }

    if (looksDynamic(seg)) {
      continue;
    }

    const label =
      seg === 'dashboard' || seg === 'portal'
        ? 'Dashboard'
        : (SEGMENT_LABELS[seg] ?? humanize(seg));

    crumbs.push({ label, href: acc });
  }

  if (crumbs.length === 0) {
    return [{ label: title }];
  }

  // Collapse accidental "Dashboard > Dashboard" on home routes.
  if (
    crumbs.length === 2 &&
    crumbs[0]?.label === crumbs[1]?.label &&
    !crumbs[1]?.href
  ) {
    return [{ label: title }];
  }

  return crumbs;
}
