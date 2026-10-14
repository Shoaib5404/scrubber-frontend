import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  FileUpIcon,
  LoaderIcon,
  XCircleIcon,
} from 'lucide-react';

const SAMPLE_CLAIMS = [
  { id: 'CLM-1042', status: 'valid', label: 'Valid', icon: CheckCircle2Icon },
  { id: 'CLM-1043', status: 'warning', label: 'Warning', icon: AlertTriangleIcon },
  { id: 'CLM-1044', status: 'error', label: 'Error', icon: XCircleIcon },
] as const;

/**
 * Static marketing illustration — sample data only; does not call the API.
 */
export function WorkflowPreview() {
  return (
    <div
      className="landing-workflow relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_24px_60px_-28px_rgba(15,28,36,0.35)]"
      aria-hidden="true"
    >
      <div className="border-b border-border bg-[linear-gradient(180deg,#f8fbfb_0%,#ffffff_100%)] px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[0.6875rem] tracking-wide text-muted-foreground">
              SAMPLE WORKFLOW
            </p>
            <p className="text-sm font-semibold text-foreground">
              837P → Scrub → Review
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            <LoaderIcon className="size-3.5 animate-spin motion-reduce:animate-none" />
            Validating
          </span>
        </div>
      </div>

      <div className="grid gap-0 sm:grid-cols-[1fr_1.15fr]">
        <div className="space-y-3 border-b border-border p-4 sm:border-r sm:border-b-0 sm:p-5">
          <div className="rounded-xl border border-dashed border-primary/35 bg-accent/40 p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <FileUpIcon className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">
                  professional_claims_oct.edi
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  EDI 837P · 24 claims · ready to scrub
                </p>
              </div>
            </div>
          </div>

          <ol className="space-y-2 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-success" />
              Uploaded &amp; parsed
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-primary" />
              Validation in progress
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-border" />
              Review findings
            </li>
          </ol>
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-xs font-medium text-muted-foreground">
            Validation summary
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded-md bg-success/10 px-2 py-1 font-medium text-success">
              18 valid
            </span>
            <span className="rounded-md bg-warning/10 px-2 py-1 font-medium text-warning">
              4 warnings
            </span>
            <span className="rounded-md bg-destructive/10 px-2 py-1 font-medium text-destructive">
              2 errors
            </span>
          </div>

          <ul className="mt-4 space-y-2">
            {SAMPLE_CLAIMS.map((claim) => {
              const Icon = claim.icon;
              const tone =
                claim.status === 'valid'
                  ? 'text-success bg-success/10'
                  : claim.status === 'warning'
                    ? 'text-warning bg-warning/10'
                    : 'text-destructive bg-destructive/10';
              return (
                <li
                  key={claim.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/80 px-3 py-2.5"
                >
                  <span className="font-mono text-xs text-foreground">
                    {claim.id}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${tone}`}
                  >
                    <Icon className="size-3.5" />
                    {claim.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
