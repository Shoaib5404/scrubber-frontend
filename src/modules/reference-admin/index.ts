export { DomainList } from './components/domain-list';
export { DomainRecords } from './components/domain-records';
export {
  listReferenceDomains,
  listDomainReferences,
  getDomainReference,
  createDomainReference,
  updateDomainReference,
  deleteDomainReference,
  toggleDomainReferenceActive,
} from './api';
export type { DomainSummary, ReferenceRow, PaginatedRefs, ReferenceOperation } from './types';
