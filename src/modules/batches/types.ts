/** Laravel-shaped batch/claim API types (snake_case). */

export type LaravelPaginator<T> = {
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

export type ClaimSummary = {
  id: number;
  batch_file_id: number;
  claim_id: string;
  status: string;
  total_charge: number;
  billing_provider_name: string | null;
  payer_name: string | null;
  subscriber_last_name: string | null;
  subscriber_first_name: string | null;
  patient_last_name: string | null;
  patient_first_name: string | null;
  validation_errors?: unknown;
  service_lines_count?: number;
  diagnoses_count?: number;
  service_lines?: ServiceLineSummary[];
  diagnoses?: Array<{ id: number; sequence: number; code: string; type: string | null }>;
};

export type ServiceLineSummary = {
  id: number;
  line_number: number;
  procedure_code: string;
  charge_amount: number;
  units: number;
  status: string;
  service_date_from: string | null;
  place_of_service: string | null;
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
  next_step?: { method: string; endpoint: string; description: string };
};

export type BatchValidateResult = {
  batch_id: number;
  status: 'under_processing' | 'completed' | string;
  batch_status: string;
  statistics?: BatchStatistics;
  claims?: Array<{ claim_id: string; status: string; validation_errors: unknown }>;
};

/** Human-facing pipeline stage (upload → parse → validation). */
export type PipelineStage =
  | 'uploaded'
  | 'parsed'
  | 'validating'
  | 'validation_complete'
  | 'error';

export function pipelineStage(status: string): PipelineStage {
  switch (status) {
    case 'parsed':
      return 'parsed';
    case 'validating':
      return 'validating';
    case 'validated':
      return 'validation_complete';
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
    case 'error':
      return 'Error';
    default: {
      const _exhaustive: never = stage;
      return _exhaustive;
    }
  }
}
