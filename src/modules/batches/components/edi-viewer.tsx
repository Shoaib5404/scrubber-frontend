'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { fetchBatchEdiViewer } from '../api';
import { AsyncState, friendlyError } from './async-state';

type EdiViewerProps = {
  batchId: number;
  basePath: '/portal' | '/dashboard';
};

export function EdiViewer({ batchId, basePath }: EdiViewerProps) {
  const [text, setText] = useState<string | null>(null);
  const [filename, setFilename] = useState(`batch-${batchId}.edi`);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchBatchEdiViewer(batchId);
      setText(result.text);
      setFilename(result.filename);
    } catch (err) {
      setError(friendlyError(err));
      setText(null);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    void load();
  }, [load]);

  function openInNewTab() {
    if (text == null) {
      return;
    }
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  function download() {
    if (text == null) {
      return;
    }
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <p className="mb-4 text-sm">
        <Link
          href={`${basePath}/batches/${batchId}`}
          className="text-slate-600 underline-offset-2 hover:underline"
        >
          ← Back to batch
        </Link>
      </p>

      <AsyncState loading={loading} error={error} onRetry={() => void load()}>
        {text != null ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Raw EDI</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Batch #{batchId} · {filename}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={openInNewTab}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                >
                  Open in new tab
                </button>
                <button
                  type="button"
                  onClick={download}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                >
                  Download
                </button>
              </div>
            </div>
            <pre
              className="mt-6 max-h-[70vh] overflow-auto rounded-lg border border-slate-200 bg-white p-4 font-mono text-xs leading-relaxed text-slate-800 shadow-sm whitespace-pre-wrap break-all"
              data-testid="edi-viewer-content"
            >
              {text}
            </pre>
          </>
        ) : null}
      </AsyncState>
    </div>
  );
}
