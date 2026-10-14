'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SmartTime } from '@/components/ui/smart-time';
import { AppShell } from '@/modules/batches/components/app-shell';
import { RequireAuth } from '@/modules/auth';
import {
  getMyInquiry,
  replyToMyInquiry,
  type InquiryDetail,
} from '@/modules/support/api';
import { cn } from '@/lib/utils';

const textareaClassName = cn(
  'w-full min-w-0 rounded-lg border border-input bg-card px-3 py-2 text-base shadow-xs',
  'transition-[color,background-color,border-color,box-shadow] duration-150 outline-none',
  'placeholder:text-muted-foreground',
  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
  'disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-50',
  'md:text-sm dark:bg-input/30',
);

function authorLabel(message: InquiryDetail['messages'][number]): string {
  if (message.author_type === 'staff') {
    return 'Support team';
  }
  if (message.author_type === 'customer') {
    return message.author?.name ?? 'You';
  }
  return message.author_type;
}

export default function PortalInquiryDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [detail, setDetail] = useState<InquiryDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (!Number.isFinite(id) || id <= 0) {
      setLoading(false);
      setError('Inquiry not found.');
      return;
    }
    setLoading(true);
    void getMyInquiry(id)
      .then((data) => {
        setDetail(data);
        setError(null);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Failed to load inquiry');
        setDetail(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function onReply(event: FormEvent) {
    event.preventDefault();
    if (!detail || !reply.trim()) return;
    setBusy(true);
    try {
      await replyToMyInquiry(detail.id, reply.trim());
      setReply('');
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send reply');
    } finally {
      setBusy(false);
    }
  }

  const canReply = detail != null && detail.status !== 'closed';

  return (
    <RequireAuth>
      <AppShell
        title={detail?.public_reference ?? 'Inquiry'}
        description={detail?.subject}
        basePath="/portal"
      >
        <p className="mb-4 text-sm">
          <Link href="/portal/support" className="text-primary hover:underline">
            ← Back to support
          </Link>
        </p>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !detail ? (
          <p className="text-sm text-destructive">{error ?? 'Inquiry not found.'}</p>
        ) : (
          <div className="mx-auto max-w-2xl space-y-6" data-testid="my-inquiry-detail">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd className="mt-1 capitalize font-medium">
                  {detail.status.replace(/_/g, ' ')}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Category</dt>
                <dd className="mt-1 font-medium">{detail.category_label}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd className="mt-1">
                  <SmartTime value={detail.created_at} />
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Updated</dt>
                <dd className="mt-1">
                  <SmartTime value={detail.updated_at} />
                </dd>
              </div>
            </dl>

            <section>
              <h2 className="text-sm font-semibold">Your message</h2>
              <p className="mt-2 whitespace-pre-wrap rounded-lg border border-border bg-card p-4 text-sm">
                {detail.description}
              </p>
            </section>

            <section>
              <h2 className="text-sm font-semibold">Conversation</h2>
              <ul className="mt-2 space-y-3">
                {detail.messages.length === 0 ? (
                  <li className="text-sm text-muted-foreground">
                    No replies yet. Our team will respond here.
                  </li>
                ) : (
                  detail.messages.map((m) => (
                    <li
                      key={m.id}
                      className={cn(
                        'rounded-lg border border-border p-3 text-sm',
                        m.author_type === 'staff'
                          ? 'bg-primary/5'
                          : 'bg-card',
                      )}
                    >
                      <p className="text-xs text-muted-foreground">
                        {authorLabel(m)} · <SmartTime value={m.created_at} />
                      </p>
                      <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
                    </li>
                  ))
                )}
              </ul>

              {canReply ? (
                <form onSubmit={onReply} className="mt-4 space-y-2">
                  <Label htmlFor="my-inq-reply">Add a reply</Label>
                  <textarea
                    id="my-inq-reply"
                    rows={4}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    required
                    className={textareaClassName}
                    placeholder="Add more detail for our support team"
                  />
                  <Button type="submit" disabled={busy || !reply.trim()}>
                    {busy ? 'Sending…' : 'Send reply'}
                  </Button>
                </form>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  This inquiry is closed. Submit a new inquiry if you need more
                  help.
                </p>
              )}
            </section>
          </div>
        )}
      </AppShell>
    </RequireAuth>
  );
}
