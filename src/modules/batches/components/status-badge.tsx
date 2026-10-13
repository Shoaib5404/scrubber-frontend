import { pipelineStage, pipelineStageLabel, type PipelineStage } from '../types';

const STAGE_CLASS: Record<PipelineStage, string> = {
  uploaded: 'bg-slate-100 text-slate-800',
  parsed: 'bg-sky-100 text-sky-900',
  validating: 'bg-indigo-100 text-indigo-900',
  validation_complete: 'bg-emerald-100 text-emerald-900',
  exported: 'bg-violet-100 text-violet-900',
  error: 'bg-red-100 text-red-900',
};

export function StatusBadge({ status }: { status: string }) {
  const stage = pipelineStage(status);
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${STAGE_CLASS[stage]}`}
      data-stage={stage}
      data-status={status}
    >
      {pipelineStageLabel(stage)}
    </span>
  );
}

export function ClaimStatusBadge({ status }: { status: string }) {
  const tone =
    status === 'valid'
      ? 'bg-emerald-100 text-emerald-900'
      : status === 'warning'
        ? 'bg-amber-100 text-amber-900'
        : status === 'error'
          ? 'bg-red-100 text-red-900'
          : 'bg-slate-100 text-slate-800';
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize ${tone}`}>
      {status}
    </span>
  );
}
