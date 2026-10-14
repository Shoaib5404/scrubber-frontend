import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  LoaderIcon,
  XCircleIcon,
} from 'lucide-react';
import { pipelineStage, pipelineStageLabel, type PipelineStage } from '../types';

const STAGE_CLASS: Record<PipelineStage, string> = {
  uploaded: 'bg-muted text-foreground border-transparent',
  parsed: 'bg-info/10 text-info border-transparent',
  validating: 'bg-primary/10 text-primary border-transparent',
  validation_complete: 'bg-success/10 text-success border-transparent',
  exported: 'bg-secondary text-secondary-foreground border-transparent',
  error: 'bg-destructive/10 text-destructive border-transparent',
};

const STAGE_ICON: Record<PipelineStage, React.ReactNode> = {
  uploaded: <CircleDotIcon data-icon="inline-start" />,
  parsed: <CircleDotIcon data-icon="inline-start" />,
  validating: <LoaderIcon data-icon="inline-start" />,
  validation_complete: <CheckCircle2Icon data-icon="inline-start" />,
  exported: <CheckCircle2Icon data-icon="inline-start" />,
  error: <XCircleIcon data-icon="inline-start" />,
};

export function StatusBadge({ status }: { status: string }) {
  const stage = pipelineStage(status);
  return (
    <Badge
      variant="outline"
      className={cn('rounded-md font-medium capitalize', STAGE_CLASS[stage])}
      data-stage={stage}
      data-status={status}
    >
      {STAGE_ICON[stage]}
      {pipelineStageLabel(stage)}
    </Badge>
  );
}

export function ClaimStatusBadge({ status }: { status: string }) {
  const tone =
    status === 'valid'
      ? 'bg-success/10 text-success border-transparent'
      : status === 'warning'
        ? 'bg-warning/10 text-warning border-transparent'
        : status === 'error'
          ? 'bg-destructive/10 text-destructive border-transparent'
          : 'bg-muted text-foreground border-transparent';

  const icon =
    status === 'valid' ? (
      <CheckCircle2Icon data-icon="inline-start" />
    ) : status === 'warning' ? (
      <AlertTriangleIcon data-icon="inline-start" />
    ) : status === 'error' ? (
      <XCircleIcon data-icon="inline-start" />
    ) : (
      <CircleDotIcon data-icon="inline-start" />
    );

  return (
    <Badge
      variant="outline"
      className={cn('rounded-md font-medium capitalize', tone)}
    >
      {icon}
      {status}
    </Badge>
  );
}
