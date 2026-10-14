'use client';

import { FormEvent, useState } from 'react';
import { AppSelect } from '@/components/forms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  INQUIRY_ACCEPT,
  INQUIRY_MAX_BYTES,
  PORTAL_CATEGORIES,
  createPortalInquiry,
  mimeForInquiryFile,
  presignInquiryAttachment,
  putInquiryAttachment,
} from '../api';

const textareaClassName = cn(
  'w-full min-w-0 rounded-lg border border-input bg-card px-3 py-2 text-base shadow-xs',
  'transition-[color,background-color,border-color,box-shadow] duration-150 outline-none',
  'placeholder:text-muted-foreground',
  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
  'disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-50',
  'md:text-sm dark:bg-input/30',
);

type Props = {
  onSubmitted?: () => void;
  /** Tighter spacing for side-by-side Support layout. */
  compact?: boolean;
};

export function PortalInquiryForm({ onSubmitted, compact = false }: Props) {
  const [category, setCategory] = useState<string>(PORTAL_CATEGORIES[0].value);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setReference(null);

    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();
    if (!trimmedSubject || !trimmedMessage) {
      setError('Subject and message are required.');
      return;
    }
    if (file && file.size > INQUIRY_MAX_BYTES) {
      setError(
        `File must be at most ${Math.round(INQUIRY_MAX_BYTES / 1024 / 1024)} MB.`,
      );
      return;
    }

    setBusy(true);
    try {
      let attachment:
        | {
            attachment_object_key: string;
            attachment_original_name: string;
            attachment_mime_type: string;
            attachment_size_bytes: number;
          }
        | undefined;

      if (file) {
        const mimeType = mimeForInquiryFile(file);
        const signed = await presignInquiryAttachment({
          originalFilename: file.name,
          mimeType,
          sizeBytes: file.size,
        });
        await putInquiryAttachment(signed.url, file, signed.headers);
        attachment = {
          attachment_object_key: signed.objectKey,
          attachment_original_name: signed.originalFilename,
          attachment_mime_type: signed.mimeType,
          attachment_size_bytes: file.size,
        };
      }

      const ticket = await createPortalInquiry({
        category,
        subject: trimmedSubject,
        message: trimmedMessage,
        ...attachment,
      });
      setReference(ticket.public_reference);
      setSubject('');
      setMessage('');
      setFile(null);
      onSubmitted?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to submit inquiry');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        'flex w-full flex-col',
        compact ? 'gap-3' : 'mx-auto max-w-xl gap-6',
      )}
      noValidate
      data-testid="portal-inquiry-form"
    >
      {compact ? (
        <div>
          <h2 className="text-base font-semibold">New inquiry</h2>
          <p className="text-sm text-muted-foreground">
            Describe your issue. You may attach one file.
          </p>
        </div>
      ) : null}
      <AppSelect
        id="inq-category"
        label="Query type"
        required
        value={category}
        onValueChange={setCategory}
        options={PORTAL_CATEGORIES.map((c) => ({
          value: c.value,
          label: c.label,
        }))}
        placeholder="Select query type"
        data-testid="inq-category"
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inq-subject">
          Subject <span className="text-destructive">*</span>
        </Label>
        <Input
          id="inq-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          maxLength={255}
          placeholder="Brief summary of your issue"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inq-message">
          Message <span className="text-destructive">*</span>
        </Label>
        <textarea
          id="inq-message"
          rows={compact ? 4 : 5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          placeholder="Describe the issue or question"
          className={textareaClassName}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inq-file">Attachment (optional)</Label>
        <Input
          id="inq-file"
          type="file"
          accept={INQUIRY_ACCEPT}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <p className="text-xs text-muted-foreground">
          .edi, .x12, .txt, .png, .jpg · max{' '}
          {Math.round(INQUIRY_MAX_BYTES / 1024 / 1024)} MB
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {reference ? (
        <p className="text-sm text-muted-foreground" role="status">
          Inquiry received. Reference{' '}
          <span className="font-medium text-foreground">{reference}</span>. Our
          team will follow up using your account email.
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Submitting…' : 'Submit inquiry'}
        </Button>
        <p className="text-xs text-muted-foreground">
          Do not include patient names, dates of birth, insurance member IDs,
          or other sensitive health information.
        </p>
      </div>
    </form>
  );
}
