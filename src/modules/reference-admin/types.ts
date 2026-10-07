/** Admin reference API types (snake_case rows). */

export type ReferenceOperation =
  | 'list'
  | 'show'
  | 'create'
  | 'update'
  | 'destroy'
  | 'toggle_active';

export type DomainSummary = {
  slug: string;
  title: string;
  ops: ReferenceOperation[];
};

export type ReferenceRow = Record<string, unknown> & {
  id?: number;
};

export type PaginatedRefsMeta = {
  page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type PaginatedRefs = {
  items: ReferenceRow[];
  meta: PaginatedRefsMeta;
};

export type ApiSuccess<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type DomainsPayload = {
  domains: DomainSummary[];
};

export function domainHasOp(ops: ReferenceOperation[], op: ReferenceOperation): boolean {
  return ops.includes(op);
}
