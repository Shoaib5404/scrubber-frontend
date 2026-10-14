import { BRAND_NAME } from '@/lib/brand';

export const LANDING_NAV = [
  { href: '#product', label: 'Product' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#packages', label: 'Packages' },
  { href: '#security', label: 'Security' },
  { href: '#faq', label: 'FAQ' },
] as const;

export const HERO = {
  headline: 'Catch claim issues before submission.',
  support:
    'Validate professional healthcare claims with a structured scrubbing workflow that helps billing teams identify issues, review validation results, and prepare claims for the next step in their workflow.',
  scope: 'Built for EDI 837P professional claim files.',
} as const;

export const TRUST_ITEMS = [
  'EDI 837P professional claim workflows',
  'Structured validation results',
  'Batch-oriented processing',
  'Claim-level issue review',
] as const;

export const VALUE_THEMES = [
  {
    title: 'Find issues earlier',
    body: 'Surface data and structural problems in claim files before they move further downstream in your revenue-cycle workflow.',
  },
  {
    title: 'Review findings clearly',
    body: 'Inspect errors, warnings, and passed checks in a structured format so billing specialists can act with confidence.',
  },
  {
    title: 'Track batches end to end',
    body: 'Follow uploads from parse through validation with status visibility across your organization’s batches.',
  },
  {
    title: 'Work at claim level',
    body: 'Open individual claims, examine findings, and update claim details when your subscription and permissions allow.',
  },
] as const;

export const HOW_STEPS = [
  {
    step: '01',
    title: 'Upload',
    body: 'Submit an eligible EDI 837P professional claim file through the portal upload workflow.',
  },
  {
    step: '02',
    title: 'Process',
    body: 'The system parses the file into batches and claims according to the implemented processing pipeline.',
  },
  {
    step: '03',
    title: 'Validate',
    body: 'Applied validation rules identify potential errors, warnings, and other findings on each claim.',
  },
  {
    step: '04',
    title: 'Review',
    body: 'Inspect batch status and claim-level findings, then take the review actions supported in your portal.',
  },
] as const;

export const GET_STARTED_STEPS = [
  {
    step: '1',
    title: 'Request access',
    body: 'Tell us about your billing organization. We confirm fit and outline the right subscription package.',
  },
  {
    step: '2',
    title: 'Activate subscription',
    body: 'Your tenant, users, and enabled features (web upload, API access, and related scopes) are provisioned by our team.',
  },
  {
    step: '3',
    title: 'Sign in to the portal',
    body: 'Team members sign in to the customer portal. Staff administrators use the staff workspace when invited.',
  },
  {
    step: '4',
    title: 'Upload and scrub claims',
    body: 'Upload EDI 837P files, monitor batch progress, and review claim-level validation findings with your team.',
  },
] as const;

export const FEATURES = [
  {
    id: 'edi',
    title: 'EDI 837P support',
    body: 'Upload and process professional claim files through the portal’s batch workflow designed for EDI 837P.',
  },
  {
    id: 'validation',
    title: 'Structured claim validation',
    body: 'Claims are evaluated with the application’s rule pipeline so teams can see errors, warnings, and valid results.',
  },
  {
    id: 'batches',
    title: 'Batch visibility',
    body: 'Monitor upload, parse, validating, and validation-complete states across recent and historical batches.',
  },
  {
    id: 'claims',
    title: 'Claim-level findings',
    body: 'Open a claim to inspect findings, demographics, service lines, and related detail used in day-to-day review.',
  },
  {
    id: 'roles',
    title: 'Role-aware workspaces',
    body: 'Customer teams work in the portal; staff operators manage tenants, users, references, and platform operations.',
  },
  {
    id: 'api',
    title: 'Integrations API',
    body: 'When included in your subscription, create and rotate API credentials for batch and reference scopes.',
  },
] as const;

export const SERVICES = [
  {
    title: 'Claims scrubbing portal',
    body: 'Web upload, batch list, claim detail, and validation review for billing operations teams.',
    image: '/landing/ops-workspace.jpg',
    imageAlt: 'Analytics dashboard on a laptop representing claim operations visibility',
  },
  {
    title: 'Team collaboration',
    body: 'Invite members, review activity, and keep organization-level visibility for tenant admins.',
    image: '/landing/team-review.jpg',
    imageAlt: 'Team collaborating around a table during operational review',
  },
  {
    title: 'Operational reporting',
    body: 'Dashboard KPIs and recent activity help managers see volume, progress, and upload issues at a glance.',
    image: '/landing/data-workflow.jpg',
    imageAlt: 'Laptop with charts representing operational claim workflow metrics',
  },
] as const;

/** Capability packages aligned with product plan codes — no invented prices. */
export const PACKAGES = [
  {
    id: 'basic',
    name: 'Basic',
    summary: 'Core portal scrubbing for a single billing organization.',
    includes: [
      'Customer portal access',
      'Web EDI 837P upload & validation',
      'Batch and claim review',
      'Team member access (tenant roles)',
    ],
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    summary: 'Expanded operational capacity for growing billing teams.',
    includes: [
      'Everything in Basic',
      'Broader team collaboration',
      'Integrations-ready feature options',
      'Priority onboarding coordination',
    ],
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    summary: 'Organization-scale access with API and platform coordination.',
    includes: [
      'Everything in Pro',
      'API access & credential management (when enabled)',
      'Batches and reference API scopes (when enabled)',
      'Staff-coordinated tenant configuration',
    ],
    highlighted: false,
  },
] as const;

export const SECURITY_POINTS = [
  {
    title: 'Authentication & access control',
    body: 'Sign-in protects application areas. Permissions gate staff administration and customer portal capabilities.',
  },
  {
    title: 'Tenant isolation',
    body: 'Customer organizations work within their tenant boundary. Staff tools are separated from customer workflows.',
  },
  {
    title: 'Protected routes',
    body: 'Dashboard, batches, claims, and admin screens require authenticated access appropriate to each role.',
  },
  {
    title: 'Subscription-aware features',
    body: 'Upload, validation, and API features follow the features enabled on your organization’s subscription.',
  },
] as const;

export const FAQ_ITEMS = [
  {
    q: 'What is an EDI 837P claims scrubber?',
    a: `${BRAND_NAME} helps billing teams upload professional claim files, run structured validation, and review findings before claims move further in their workflow.`,
  },
  {
    q: 'Who is the product designed for?',
    a: 'Medical billing companies, healthcare practice administrators, revenue-cycle teams, and operations managers who process professional healthcare claims.',
  },
  {
    q: 'What does the validation workflow do?',
    a: 'After upload and parse, applicable validation rules produce claim-level findings such as errors, warnings, and valid outcomes that you can inspect in the portal.',
  },
  {
    q: 'How does batch processing work?',
    a: 'Each uploaded file becomes a batch with visible pipeline status. You can open the batch, review claims, and follow validation progress.',
  },
  {
    q: 'Can I inspect issues for individual claims?',
    a: 'Yes. Open a claim from a batch to review status, findings, and claim detail supported by the application.',
  },
  {
    q: 'How do packages and subscriptions work?',
    a: 'Access is provisioned per organization. Plans such as Basic, Pro, and Enterprise map to portal and optional API features. Pricing and entitlements are confirmed during onboarding—request a demo to discuss the right fit.',
  },
  {
    q: 'How do I access the application?',
    a: 'Existing users sign in from the Sign In link. New organizations request a demo so we can set up tenant access and subscription features.',
  },
  {
    q: 'How can I request a demonstration?',
    a: 'Use Request a Demo on this page. Share your name, work email, organization, and a short note—we will follow up to schedule a walkthrough.',
  },
] as const;

export const FINAL_CTA = {
  headline: 'Bring more clarity to your claim review workflow.',
  support:
    'See how structured professional claim validation can fit into your team’s day-to-day operations.',
} as const;

export const FOOTER_BLURB = `${BRAND_NAME} is an EDI 837P claims scrubbing portal for healthcare billing operations—upload, validate, and review claims with your team.`;
