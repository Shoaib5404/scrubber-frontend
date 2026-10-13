/** Batch/claim API types (snake_case). */

export type LengthAwarePaginator<T> = {
  current_page: number;
  data: T[];
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
};

export type BatchSummary = {
  id: number;
  filename: string;
  original_filename: string;
  status: string;
  uploaded_by: number | null;
  isa_sender_id?: string | null;
  isa_receiver_id?: string | null;
  isa_control_number?: string | null;
  isa_date?: string | null;
  bht_date?: string | null;
  gs_sender_code?: string | null;
  gs_receiver_code?: string | null;
  gs_control_number?: string | null;
  gs_version_code?: string | null;
  gs_version?: string | null;
  total_claims: number;
  valid_claims: number;
  error_claims: number;
  warning_claims: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
  claims_count?: number;
};

export type BatchStatistics = {
  total_claims: number;
  total_amount: number;
  total_service_lines: number;
  pending_claims: number;
  valid_claims: number;
  warning_claims: number;
  error_claims: number;
  status_breakdown: {
    pending: number;
    valid: number;
    warning: number;
    error: number;
  };
};

export type ValidationIssue = {
  field?: string;
  rule?: string;
  message?: string;
  severity?: 'error' | 'warning' | 'info' | string;
  help_text?: string | null;
  policy_modal?: string | null;
  details_url?: string | null;
  cpt_code?: string | null;
  icd_code?: string | null;
};

/** Editable COB / other-subscriber fields. */
export type OtherSubscriberRow = {
  member_id?: string | null;
  group_number?: string | null;
  group_name?: string | null;
  ssn?: string | null;
  claim_filing_indicator?: string | null;
  payer_name?: string | null;
  remittance_date?: string | null;
  payer_claim_control_number?: string | null;
  payer_paid_amount?: string | number | null;
  remaining_patient_liability?: string | number | null;
  [key: string]: unknown;
};

export type ClaimDiagnosis = {
  id: number;
  sequence: number;
  code: string;
  type: string | null;
  description?: string | null;
};

export type ServiceLineSummary = {
  id: number;
  claim_id?: number;
  line_number: number;
  procedure_code: string;
  procedure_description?: string | null;
  modifier_1?: string | null;
  modifier_2?: string | null;
  modifier_3?: string | null;
  modifier_4?: string | null;
  charge_amount: number;
  units: number;
  unit_scale?: string;
  status: string;
  service_date_from: string | null;
  service_date_to?: string | null;
  place_of_service: string | null;
  diagnosis_pointers?: unknown;
  rendering_provider_npi?: string | null;
  referring_provider_npi?: string | null;
  referring_provider_last_name?: string | null;
  referring_provider_first_name?: string | null;
  referring_provider_middle_name?: string | null;
  other_payer_paid_amount?: number | null;
  ndc_code?: string | null;
  ndc_quantity?: number | null;
  ndc_unit?: string | null;
  validation_errors?: unknown;
  is_modified?: boolean;
};

export type ClaimSummary = {
  id: number;
  batch_file_id: number;
  claim_id: string;
  status: string;
  total_charge: number;
  billing_provider_name: string | null;
  billing_provider_npi?: string | null;
  billing_provider_tax_id?: string | null;
  billing_provider_ssn?: string | null;
  billing_provider_taxonomy?: string | null;
  billing_provider_upin?: string | null;
  billing_provider_state_license?: string | null;
  billing_provider_address?: string | null;
  billing_provider_address_line_1?: string | null;
  billing_provider_address_line_2?: string | null;
  billing_provider_city?: string | null;
  billing_provider_state?: string | null;
  billing_provider_zip?: string | null;
  subscriber_last_name: string | null;
  subscriber_first_name: string | null;
  subscriber_member_id?: string | null;
  subscriber_ssn?: string | null;
  subscriber_dob?: string | null;
  subscriber_gender?: string | null;
  subscriber_address?: string | null;
  subscriber_group_number?: string | null;
  subscriber_group_name?: string | null;
  subscriber_relationship?: string | null;
  payer_responsibility?: string | null;
  claim_filing_indicator?: string | null;
  insurance_type_code?: string | null;
  other_subscribers?: OtherSubscriberRow[] | null;
  patient_last_name: string | null;
  patient_first_name: string | null;
  patient_dob?: string | null;
  patient_gender?: string | null;
  patient_relationship?: string | null;
  patient_address?: string | null;
  payer_name: string | null;
  payer_id?: string | null;
  payer_address?: string | null;
  rendering_provider_npi?: string | null;
  rendering_provider_last_name?: string | null;
  rendering_provider_first_name?: string | null;
  rendering_provider_middle_name?: string | null;
  rendering_provider_upin?: string | null;
  rendering_provider_state_license?: string | null;
  referring_provider_npi?: string | null;
  referring_provider_last_name?: string | null;
  referring_provider_first_name?: string | null;
  referring_provider_middle_name?: string | null;
  referring_provider_upin?: string | null;
  referring_provider_state_license?: string | null;
  facility_name?: string | null;
  facility_npi?: string | null;
  facility_address?: string | null;
  place_of_service?: string | null;
  frequency_code?: string | null;
  delay_reason_code?: string | null;
  submission_method?: string | null;
  related_causes_code?: string | null;
  admission_date?: string | null;
  discharge_date?: string | null;
  onset_of_illness_date?: string | null;
  last_menstrual_period_date?: string | null;
  initial_treatment_date?: string | null;
  last_seen_date?: string | null;
  accident_date?: string | null;
  last_xray_date?: string | null;
  hearing_vision_prescription_date?: string | null;
  disability_start_date?: string | null;
  disability_end_date?: string | null;
  last_worked_date?: string | null;
  authorized_return_to_work_date?: string | null;
  assumed_care_date?: string | null;
  relinquished_care_date?: string | null;
  prior_auth_number?: string | null;
  referral_number?: string | null;
  clia_number?: string | null;
  mammography_certification_number?: string | null;
  claim_note?: string | null;
  validation_errors?: ValidationIssue[] | unknown;
  is_modified?: boolean;
  service_lines_count?: number;
  diagnoses_count?: number;
  service_lines?: ServiceLineSummary[];
  diagnoses?: ClaimDiagnosis[];
};

export type ClaimValidateResult = {
  status?: string;
  error_count?: number;
  warning_count?: number;
};

export type ApiSuccess<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type BatchUploadResult = {
  batch_id: number;
  status: string;
  edi_syntax: string;
  original_filename: string;
  total_claims: number;
  validation_queued?: boolean;
  validation_warning?: string | null;
  claim_validation_complete?: boolean;
  next_step?: { method: string; endpoint: string; description: string };
};

export type BatchValidateResult = {
  batch_id: number;
  status: 'under_processing' | 'completed' | string;
  batch_status: string;
  statistics?: BatchStatistics;
  claims?: Array<{ claim_id: string; status: string; validation_errors: unknown }>;
};

export type BatchStatusPoll = {
  status: string;
  label: string;
  total_claims: number;
  valid_claims: number;
  error_claims: number;
  warning_claims: number;
  pending_claims: number;
};

/** BatchStatus values used in filters / badges. */
export const BATCH_STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'parsed', label: 'Parsed' },
  { value: 'validating', label: 'Validating' },
  { value: 'validated', label: 'Validated' },
  { value: 'exported', label: 'Exported' },
  { value: 'error', label: 'Error' },
];

/** Human-facing pipeline stage (upload → parse → validation → export). */
export type PipelineStage =
  | 'uploaded'
  | 'parsed'
  | 'validating'
  | 'validation_complete'
  | 'exported'
  | 'error';

export function pipelineStage(status: string): PipelineStage {
  switch (status) {
    case 'parsed':
      return 'parsed';
    case 'validating':
      return 'validating';
    case 'validated':
      return 'validation_complete';
    case 'exported':
      return 'exported';
    case 'error':
      return 'error';
    case 'pending':
    case 'processing':
    default:
      return 'uploaded';
  }
}

export function pipelineStageLabel(stage: PipelineStage): string {
  switch (stage) {
    case 'uploaded':
      return 'Uploaded';
    case 'parsed':
      return 'Parsed — ready to validate';
    case 'validating':
      return 'Validation in progress';
    case 'validation_complete':
      return 'Validation complete';
    case 'exported':
      return 'Exported';
    case 'error':
      return 'Error';
    default: {
      const _exhaustive: never = stage;
      return _exhaustive;
    }
  }
}

/** Statuses that should keep the batch-detail poll alive. */
export function isBatchStatusPollable(status: string): boolean {
  return status === 'pending' || status === 'processing' || status === 'validating';
}

export function isBatchStatusTerminal(status: string): boolean {
  return status === 'validated' || status === 'exported' || status === 'error';
}
