'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { DownloadIcon, ExternalLinkIcon } from 'lucide-react';
import { fetchBatchEdiViewer } from '../api';
import { AsyncState, friendlyError } from './async-state';
import { Button } from '@/components/ui/button';

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
    <div className="flex flex-col gap-4">
      <p className="text-sm">
        <Link
          href={`${basePath}/batches/${batchId}`}
          className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          ← Back to batch
        </Link>
      </p>

      <AsyncState loading={loading} error={error} onRetry={() => void load()}>
        {text != null ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Raw EDI</h2>
                <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                  Batch #{batchId} · {filename}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={openInNewTab}>
                  <ExternalLinkIcon data-icon="inline-start" />
                  Open in new tab
                </Button>
                <Button type="button" variant="outline" onClick={download}>
                  <DownloadIcon data-icon="inline-start" />
                  Download
                </Button>
              </div>
            </div>
            <pre
              className="max-h-[70vh] overflow-auto rounded-lg border border-border bg-card p-4 font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap break-all"
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
