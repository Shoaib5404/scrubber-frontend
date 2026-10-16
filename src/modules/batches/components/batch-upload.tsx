'use client';

import { FormEvent, useId, useRef, useState } from 'react';
import { toast } from 'sonner';
import { UploadIcon, Loader2Icon } from 'lucide-react';
import { sanitizeCustomerFacingMessage } from '@/lib/api/customer-facing-message';
import { ApiClientError, type EdiStructuralIssue } from '@/lib/api/errors';
import { uploadBatch } from '../api';
import { friendlyError } from './async-state';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type BatchUploadProps = {
  onUploaded: (batchId: number) => void;
};

type UploadPhase = 'idle' | 'authorizing' | 'uploading' | 'finalizing';

/** Match Laravel neo-scrubber: 10MB (`SCRUBBER_MAX_FILE_SIZE`). */
const EDI_MAX_CLIENT_BYTES = 10_485_760;

export function BatchUpload({ onUploaded }: BatchUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<UploadPhase>('idle');
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [structuralIssues, setStructuralIssues] = useState<EdiStructuralIssue[] | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const loading = phase !== 'idle';

  function acceptFile(next: File | null) {
    setFile(next);
    setError(null);
    setStructuralIssues(null);
    setSuccess(null);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setError('Choose an EDI file to upload.');
      setStructuralIssues(null);
      return;
    }
    if (file.size <= 0) {
      setError('The selected file is empty.');
      setStructuralIssues(null);
      return;
    }
    if (file.size > EDI_MAX_CLIENT_BYTES) {
      setError(`EDI file exceeds the maximum size of 10 MB.`);
      setStructuralIssues(null);
      return;
    }

    setPhase('authorizing');
    setProgress(null);
    setError(null);
    setStructuralIssues(null);
    setSuccess(null);
    try {
      setPhase('uploading');
      const result = await uploadBatch(file, (pct) => {
        setProgress(pct);
        if (pct >= 100) {
          setPhase('finalizing');
        }
      });
      setPhase('finalizing');
      let message: string;
      if (result.validation_warning) {
        message = sanitizeCustomerFacingMessage(
          `Upload complete. ${result.total_claims} claim(s) parsed, but validation did not start: ${result.validation_warning}`,
          `Upload complete. ${result.total_claims} claim(s) parsed, but validation could not be started. Please contact support.`,
        );
      } else if (result.validation_queued) {
        message = `Upload complete. ${result.total_claims} claim(s) parsed. Rule validation is running.`;
      } else {
        message = `Upload complete. ${result.total_claims} claim(s) parsed and rule validation is complete.`;
      }
      setSuccess(message);
      toast.success('EDI file uploaded');
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      onUploaded(result.batch_id);
    } catch (err) {
      const message = friendlyError(err);
      setError(message);
      setStructuralIssues(
        err instanceof ApiClientError ? err.ediStructuralIssues ?? null : null,
      );
      toast.error(message);
    } finally {
      setPhase('idle');
      setProgress(null);
    }
  }

  const buttonLabel =
    phase === 'authorizing'
      ? 'Preparing…'
      : phase === 'uploading'
        ? progress != null
          ? `Uploading ${progress}%…`
          : 'Uploading…'
        : phase === 'finalizing'
          ? 'Checking file…'
          : 'Upload';

  return (
    <Card aria-label="Upload EDI batch">
      <CardHeader>
        <CardTitle className="text-base">Upload EDI file</CardTitle>
        <CardDescription>
          Accepts .edi or .txt up to 10 MB. After upload, the file is checked and rule validation
          runs automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div
            className={cn(
              'flex flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center transition-colors',
              dragOver ? 'border-primary bg-accent' : 'border-border bg-muted/40',
              loading && 'opacity-60',
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const dropped = e.dataTransfer.files?.[0] ?? null;
              acceptFile(dropped);
            }}
          >
            <UploadIcon className="mb-2 size-6 text-muted-foreground" aria-hidden />
            <Label htmlFor={inputId} className="cursor-pointer text-sm font-medium">
              Drag and drop an EDI file, or browse
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">.edi, .txt · max 10 MB</p>
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept=".edi,.txt,text/plain"
              onChange={(e) => acceptFile(e.target.files?.[0] ?? null)}
              disabled={loading}
              className="sr-only"
            />
            {file ? (
              <p className="mt-3 text-sm text-foreground tabular-nums">
                {file.name}{' '}
                <span className="text-muted-foreground">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </p>
            ) : null}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading || !file}>
              {loading ? (
                <Loader2Icon data-icon="inline-start" className="animate-spin" />
              ) : (
                <UploadIcon data-icon="inline-start" />
              )}
              {buttonLabel}
            </Button>
          </div>

          {phase === 'uploading' && progress != null ? (
            <div
              className="h-1.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Upload progress"
            >
              <div
                className="h-full bg-primary transition-[width] duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
          ) : null}
          {phase === 'finalizing' ? (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              File upload finished. Checking the EDI file and saving claims.
            </p>
          ) : null}

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {structuralIssues && structuralIssues.length > 0 ? (
            <StructuralIssueList issues={structuralIssues} />
          ) : null}
          {success ? (
            <Alert data-testid="upload-success">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

function StructuralIssueList({ issues }: { issues: EdiStructuralIssue[] }) {
  const errorCount = issues.filter((issue) => issue.severity !== 'warning').length;
  const warningCount = issues.length - errorCount;

  return (
    <div
      className="overflow-hidden rounded-lg border border-destructive/30"
      data-testid="edi-structural-issues"
    >
      <div className="bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive">
        EDI structural issues ({errorCount} errors, {warningCount} warnings)
      </div>
      <ul className="max-h-64 divide-y overflow-y-auto text-sm">
        {issues.map((issue, index) => {
          const warning = issue.severity === 'warning';
          return (
            <li
              key={`${issue.rule}-${index}`}
              className={
                warning
                  ? 'bg-amber-50 px-4 py-2 text-amber-950'
                  : 'px-4 py-2 text-destructive'
              }
            >
              {issue.rule ? (
                <span className="mr-2 font-mono text-xs">{issue.rule}</span>
              ) : null}
              {issue.message}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
