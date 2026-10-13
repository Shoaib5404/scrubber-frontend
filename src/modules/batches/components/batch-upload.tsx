'use client';

import { FormEvent, useId, useState } from 'react';
import { uploadBatch } from '../api';
import { friendlyError } from './async-state';
import { pipelineStage, pipelineStageLabel } from '../types';

type BatchUploadProps = {
  onUploaded: (batchId: number) => void;
};

type UploadPhase = 'idle' | 'authorizing' | 'uploading' | 'finalizing';

const EDI_MAX_CLIENT_BYTES = 26_214_400;

/**
 * Presign → PUT MinIO → complete (TeleWound-aligned).
 * Nest validates/parses only after the object is confirmed in storage.
 */
export function BatchUpload({ onUploaded }: BatchUploadProps) {
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<UploadPhase>('idle');
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loading = phase !== 'idle';

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setError('Choose an EDI file to upload.');
      return;
    }
    if (file.size <= 0) {
      setError('The selected file is empty.');
      return;
    }
    if (file.size > EDI_MAX_CLIENT_BYTES) {
      setError(`EDI file exceeds the maximum size of ${EDI_MAX_CLIENT_BYTES} bytes.`);
      return;
    }

    setPhase('authorizing');
    setProgress(null);
    setError(null);
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
      const stage = pipelineStage(result.status);
      if (result.validation_warning) {
        setSuccess(
          `Upload complete — EDI syntax ${result.edi_syntax}. ${result.total_claims} claim(s) parsed, ` +
            `but validation did not start: ${result.validation_warning}`,
        );
      } else if (result.validation_queued) {
        setSuccess(
          `Upload complete — EDI syntax ${result.edi_syntax}. ${result.total_claims} claim(s) parsed. ` +
            `Rule validation is queued (stage: ${pipelineStageLabel(stage)}).`,
        );
      } else {
        setSuccess(
          `Upload complete — EDI syntax ${result.edi_syntax}. ${result.total_claims} claim(s) parsed ` +
            `and rule validation is complete (stage: ${pipelineStageLabel(stage)}).`,
        );
      }
      setFile(null);
      onUploaded(result.batch_id);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setPhase('idle');
      setProgress(null);
    }
  }

  const buttonLabel =
    phase === 'authorizing'
      ? 'Authorizing…'
      : phase === 'uploading'
        ? progress != null
          ? `Uploading ${progress}%…`
          : 'Uploading…'
        : phase === 'finalizing'
          ? 'Finalizing…'
          : 'Upload';

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      aria-label="Upload EDI batch"
    >
      <h2 className="text-base font-semibold text-slate-900">Upload EDI file</h2>
      <p className="mt-1 text-sm text-slate-600">
        Upload authorizes storage, sends the file securely, then runs structural check and rule
        validation.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-800">
            EDI file
          </label>
          <input
            id={inputId}
            type="file"
            accept=".edi,.txt,text/plain"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            disabled={loading}
            className="mt-1 block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:text-white disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !file}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {buttonLabel}
        </button>
      </div>
      {phase === 'uploading' && progress != null ? (
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Upload progress"
        >
          <div
            className="h-full bg-slate-900 transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
      {error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-3 text-sm text-emerald-800" role="status" data-testid="upload-success">
          {success}
        </p>
      ) : null}
    </form>
  );
}
