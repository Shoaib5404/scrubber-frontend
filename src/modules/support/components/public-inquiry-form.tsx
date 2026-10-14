'use client';

import { FormEvent, useState } from 'react';
import { AppSelect } from '@/components/forms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PUBLIC_CATEGORIES, createPublicInquiry } from '../api';

type Props = {
  /** Default category (e.g. sales_demo for Request a Demo). */
  defaultCategory?: string;
  submitLabel?: string;
  title?: string;
};

export function PublicInquiryForm({
  defaultCategory = 'general',
  submitLabel = 'Send message',
  title,
}: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [category, setCategory] = useState<string>(defaultCategory);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setReference(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedOrg = organization.trim();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedOrg) {
      setError('Name, work email, and organization are required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Enter a valid work email address.');
      return;
    }
    if (!trimmedSubject || !trimmedMessage) {
      setError('Subject and message are required.');
      return;
    }

    setBusy(true);
    try {
      const ticket = await createPublicInquiry({
        name: trimmedName,
        email: trimmedEmail,
        organization: trimmedOrg,
        category,
        subject: trimmedSubject,
        message: trimmedMessage,
      });
      setReference(ticket.public_reference);
      setSubject('');
      setMessage('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to submit inquiry');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-6"
      noValidate
      data-testid="public-inquiry-form"
    >
      {title ? <h3 className="text-lg font-semibold">{title}</h3> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="pub-name">Full name</Label>
          <Input
            id="pub-name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pub-email">Work email</Label>
          <Input
            id="pub-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="pub-org">Organization</Label>
          <Input
            id="pub-org"
            autoComplete="organization"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            required
          />
        </div>
        <AppSelect
          id="pub-category"
          label="Inquiry type"
          required
          value={category}
          onValueChange={setCategory}
          options={PUBLIC_CATEGORIES.map((c) => ({
            value: c.value,
            label: c.label,
          }))}
          placeholder="Select inquiry type"
          data-testid="pub-category"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pub-subject">Subject</Label>
        <Input
          id="pub-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          maxLength={255}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pub-message">Message</Label>
        <textarea
          id="pub-message"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          placeholder="Tell us about claim volume, EDI workflow needs, or package interest."
          className="w-full min-w-0 rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {reference ? (
        <p className="text-sm text-muted-foreground" role="status">
          Thank you. Your inquiry was recorded as{' '}
          <span className="font-medium text-foreground">{reference}</span>. Our
          team will follow up by email.
        </p>
      ) : null}

      <Button type="submit" className="w-full sm:w-auto" disabled={busy}>
        {busy ? 'Sending…' : submitLabel}
      </Button>
      <p className="text-xs text-muted-foreground">
        We only use this information to respond to your inquiry. Do not include
        patient data, claim files, or insurance details.
      </p>
    </form>
  );
}
