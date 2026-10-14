export { StaffDashboard } from './components/staff-dashboard';
export { CustomerDashboard } from './components/customer-dashboard';
export { KpiStatGrid } from './components/kpi-stat-grid';
export { PeriodFilter } from './components/period-filter';
export {
  fetchStaffDashboardStats,
  fetchStaffDashboardActivity,
  fetchCustomerDashboardStats,
  fetchCustomerRecentBatches,
} from './api';
export type {
  DashboardPeriod,
  PeriodFilterValue,
  StaffDashboardStats,
  StaffDashboardActivity,
  CustomerDashboardStats,
} from './types';
export {
  PERIOD_OPTIONS,
  periodCaption,
  buildPeriodQuery,
} from './types';
