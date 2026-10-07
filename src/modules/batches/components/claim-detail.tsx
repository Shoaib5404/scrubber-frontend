'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { getClaim, validateClaim } from '../api';
import type { ClaimSummary } from '../types';
import { AsyncState, friendlyError } from './async-state';
import { ClaimStatusBadge } from './status-badge';

type ClaimDetailProps = {
  claimId: number;
  basePath: '/portal' | '/dashboard';
};

export function ClaimDetail({ claimId, basePath }: ClaimDetailProps) {
  const [claim, setClaim] = useState<ClaimSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setClaim(await getClaim(claimId));
    } catch (err) {
      setError(friendlyError(err));
      setClaim(null);
    } finally {
      setLoading(false);
    }
  }, [claimId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onValidate() {
    setBusy(true);
    setMessage(null);
    try {
      const result = (await validateClaim(claimId)) as { status?: string };
      setMessage(`Validation finished${result?.status ? `: ${result.status}` : '.'}`);
      await load();
    } catch (err) {
      setMessage(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="mb-4 text-sm">
        {claim ? (
          <Link
            href={`${basePath}/batches/${claim.batch_file_id}`}
            className="text-slate-600 underline-offset-2 hover:underline"
          >
            ← Back to batch
          </Link>
        ) : (
          <Link href={basePath} className="text-slate-600 underline-offset-2 hover:underline">
            ← Back
          </Link>
        )}
      </p>

      <AsyncState loading={loading} error={error} onRetry={() => void load()}>
        {claim ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{claim.claim_id}</h2>
                <p className="mt-1 text-sm text-slate-600">Claim #{claim.id}</p>
                <div className="mt-2">
                  <ClaimStatusBadge status={claim.status} />
                </div>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onValidate()}
                className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {busy ? 'Validating…' : 'Validate claim'}
              </button>
            </div>

            {message ? (
              <p className="mt-3 text-sm text-slate-700" role="status">
                {message}
              </p>
            ) : null}

            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                ['Billing provider', claim.billing_provider_name],
                ['Payer', claim.payer_name],
                ['Subscriber', [claim.subscriber_first_name, claim.subscriber_last_name].filter(Boolean).join(' ') || null],
                ['Patient', [claim.patient_first_name, claim.patient_last_name].filter(Boolean).join(' ') || null],
                ['Total charge', claim.total_charge.toFixed(2)],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="text-sm font-medium text-slate-900">{value ?? '—'}</dd>
                </div>
              ))}
            </dl>

            <section className="mt-8">
              <h3 className="text-base font-semibold">Service lines</h3>
              {claim.service_lines && claim.service_lines.length > 0 ? (
                <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                  {claim.service_lines.map((line) => (
                    <li key={line.id} className="flex justify-between gap-3 px-4 py-3 text-sm">
                      <span>
                        Line {line.line_number}: {line.procedure_code}
                      </span>
                      <span className="text-slate-600">{line.charge_amount.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-600">No service lines.</p>
              )}
            </section>
          </>
        ) : null}
      </AsyncState>
    </div>
  );
}
