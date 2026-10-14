'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AppSelect } from '@/components/forms';
import { Button } from '@/components/ui/button';
import { SmartTime } from '@/components/ui/smart-time';
import { AppShell } from '@/modules/batches/components/app-shell';
import {
  Permission,
  RequireAuth,
  hasPermission,
  useAuthStore,
} from '@/modules/auth';
import {
  INQUIRY_STATUSES,
  getAdminInquiry,
  getInquiryAttachmentUrl,
  patchInquiryStatus,
  replyToInquiry,
  type InquiryDetail,
} from '@/modules/support/api';

const STATUS_OPTIONS = INQUIRY_STATUSES.map((s) => ({
  value: s,
  label: s.replace(/_/g, ' '),
}));

export default function StaffInquiryDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const user = useAuthStore((s) => s.user);
  const canView = hasPermission(user, Permission.InquiriesView);
  const [detail, setDetail] = useState<InquiryDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (!canView || !Number.isFinite(id) || id <= 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void getAdminInquiry(id)
      .then((data) => {
        setDetail(data);
        setError(null);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Failed to load inquiry');
      })
      .finally(() => setLoading(false));
  }, [canView, id]);

  useEffect(() => {
    load();
  }, [load]);

  async function onStatusChange(status: string) {
    if (!detail) return;
    setBusy(true);
    try {
      const updated = await patchInquiryStatus(detail.id, status);
      setDetail((prev) => (prev ? { ...prev, ...updated } : prev));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update status');
    } finally {
      setBusy(false);
    }
  }

  async function onReply(event: FormEvent) {
    event.preventDefault();
    if (!detail || !reply.trim()) return;
    setBusy(true);
    try {
      await replyToInquiry(detail.id, reply.trim());
      setReply('');
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save reply');
    } finally {
      setBusy(false);
    }
  }

  async function onDownload() {
    if (!detail) return;
    setBusy(true);
    try {
      const file = await getInquiryAttachmentUrl(detail.id);
      window.open(file.url, '_blank', 'noopener,noreferrer');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to get download link');
    } finally {
      setBusy(false);
    }
  }

  return (
    <RequireAuth staffOnly>
      <AppShell
        title={detail?.public_reference ?? 'Inquiry'}
        description={detail?.subject}
        basePath="/dashboard"
      >
        <p className="mb-4 text-sm">
          <Link href="/dashboard/inquiries" className="text-primary hover:underline">
            ← All inquiries
          </Link>
        </p>
        {!canView ? (
          <p className="text-sm text-destructive">
            You do not have permission to view inquiries.
          </p>
        ) : loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !detail ? (
          <p className="text-sm text-destructive">{error ?? 'Inquiry not found.'}</p>
        ) : (
          <div className="space-y-6" data-testid="inquiry-detail">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <AppSelect
                  id="inquiry-status"
                  label="Status"
                  value={detail.status}
                  disabled={busy}
                  onValueChange={(value) => void onStatusChange(value)}
                  options={STATUS_OPTIONS}
                  className="max-w-xs"
                  data-testid="inquiry-status"
                />
              </div>
              <div>
                <dt className="text-muted-foreground">Category</dt>
                <dd className="mt-1 font-medium">{detail.category_label}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Requester</dt>
                <dd className="mt-1">
                  {detail.requester_name} &lt;{detail.requester_email}&gt;
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Organization</dt>
                <dd className="mt-1">{detail.requester_organization || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Source</dt>
                <dd className="mt-1 capitalize">{detail.source}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd className="mt-1">
                  <SmartTime value={detail.created_at} />
                </dd>
              </div>
            </dl>

            <section>
              <h2 className="text-sm font-semibold">Message</h2>
              <p className="mt-2 whitespace-pre-wrap rounded-lg border border-border bg-card p-4 text-sm">
                {detail.description}
              </p>
            </section>

            {detail.has_attachment && detail.attachment ? (
              <section>
                <h2 className="text-sm font-semibold">Attachment</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {detail.attachment.original_name} (
                  {detail.attachment.size_bytes
                    ? `${Math.round(detail.attachment.size_bytes / 1024)} KB`
                    : '—'}
                  )
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2"
                  disabled={busy}
                  onClick={() => void onDownload()}
                >
                  Download attachment
                </Button>
              </section>
            ) : null}

            <section>
              <h2 className="text-sm font-semibold">Replies</h2>
              <ul className="mt-2 space-y-3">
                {detail.messages.length === 0 ? (
                  <li className="text-sm text-muted-foreground">No replies yet.</li>
                ) : (
                  detail.messages.map((m) => (
                    <li
                      key={m.id}
                      className="rounded-lg border border-border bg-card p-3 text-sm"
                    >
                      <p className="text-xs text-muted-foreground">
                        {m.author_type}
                        {m.author ? ` · ${m.author.name}` : ''} ·{' '}
                        <SmartTime value={m.created_at} />
                      </p>
                      <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
                    </li>
                  ))
                )}
              </ul>
              <form onSubmit={onReply} className="mt-4 space-y-2">
                <label className="block text-sm">
                  <span className="mb-1 block text-muted-foreground">
                    Add reply (saved in portal; emailed to requester only for
                    Request a Demo)
                  </span>
                  <textarea
                    className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
                    rows={4}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    required
                  />
                </label>
                <Button type="submit" disabled={busy || !reply.trim()}>
                  Save reply
                </Button>
              </form>
            </section>
          </div>
        )}
      </AppShell>
    </RequireAuth>
  );
}
