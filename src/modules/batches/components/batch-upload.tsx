'use client';

import { FormEvent, useId, useState } from 'react';
import { uploadBatch } from '../api';
import { friendlyError } from './async-state';
import { pipelineStage, pipelineStageLabel } from '../types';

type BatchUploadProps = {
  onUploaded: (batchId: number) => void;
};

/**
 * Distinguishes upload → parse success (EDI syntax OK) vs later validation.
 */
export function BatchUpload({ onUploaded }: BatchUploadProps) {
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setError('Choose an EDI file to upload.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await uploadBatch(file);
      const stage = pipelineStage(result.status);
      setSuccess(
        `Upload complete — EDI syntax ${result.edi_syntax}. Stage: ${pipelineStageLabel(stage)}. ` +
          `${result.total_claims} claim(s) parsed. Rule validation is a separate step.`,
      );
      setFile(null);
      onUploaded(result.batch_id);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      aria-label="Upload EDI batch"
    >
      <h2 className="text-base font-semibold text-slate-900">Upload EDI file</h2>
      <p className="mt-1 text-sm text-slate-600">
        Upload runs structural check and parse only. Claim rule validation runs afterward on the batch.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-800">
            EDI file
          </label>
          <input
            id={inputId}
            type="file"
            accept=".edi,text/plain,*/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:text-white"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !file}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Uploading…' : 'Upload'}
        </button>
      </div>
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
