'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { canUploadOrValidate, useAuthStore } from '@/modules/auth';
import { getClaim, updateClaim, validateClaim } from '../api';
import {
  CLAIM_FILING_INDICATORS,
  CLAIM_LEVEL_DATE_FIELDS,
  GENDER_OPTIONS,
  NDC_UNIT_OPTIONS,
  optionEntries,
  PAYER_RESPONSIBILITY_OPTIONS,
  PLACES_OF_SERVICE,
  RELATIONSHIP_OPTIONS,
  SUBMISSION_METHOD_OPTIONS,
  UNIT_SCALE_OPTIONS,
} from '../claim-form-options';
import type {
  ClaimDiagnosis,
  ClaimSummary,
  OtherSubscriberRow,
  ServiceLineSummary,
  ValidationIssue,
} from '../types';
import { AsyncState, friendlyError } from './async-state';
import { ClaimStatusBadge } from './status-badge';
import {
  ValidationIssueModals,
  type ValidationModalName,
} from './validation-issue-modals';

type ClaimDetailProps = {
  claimId: number;
  basePath: '/portal' | '/dashboard';
};

type DiagnosisDraft = {
  id?: number;
  sequence: number;
  code: string;
  /** UI-only (description not persisted in Nest schema). */
  description: string;
};

type CobDraft = {
  member_id: string;
  group_number: string;
  group_name: string;
  ssn: string;
  claim_filing_indicator: string;
  payer_name: string;
  remittance_date: string;
  payer_claim_control_number: string;
  payer_paid_amount: string;
  remaining_patient_liability: string;
};

const EMPTY_COB: CobDraft = {
  member_id: '',
  group_number: '',
  group_name: '',
  ssn: '',
  claim_filing_indicator: '',
  payer_name: '',
  remittance_date: '',
  payer_claim_control_number: '',
  payer_paid_amount: '',
  remaining_patient_liability: '',
};

type LineDraft = {
  id?: number;
  line_number: number;
  procedure_code: string;
  ndc_code: string;
  ndc_quantity: string;
  ndc_unit: string;
  service_date_from: string;
  service_date_to: string;
  modifiers: string;
  diagnosis_pointers: string;
  units: string;
  unit_scale: string;
  referring_provider_npi: string;
  referring_provider_last_name: string;
  other_payer_paid_amount: string;
  isNew?: boolean;
};

type FormState = Record<string, string>;

const TEXT_FIELDS = [
  'subscriber_last_name',
  'subscriber_first_name',
  'patient_last_name',
  'patient_first_name',
  'subscriber_dob',
  'patient_dob',
  'subscriber_member_id',
  'subscriber_group_number',
  'subscriber_group_name',
  'subscriber_ssn',
  'subscriber_gender',
  'place_of_service',
  'related_causes_code',
  'delay_reason_code',
  'submission_method',
  'payer_id',
  'payer_name',
  'payer_responsibility',
  'subscriber_relationship',
  'claim_filing_indicator',
  'insurance_type_code',
  'prior_auth_number',
  'referral_number',
  'clia_number',
  'mammography_certification_number',
  'billing_provider_name',
  'billing_provider_npi',
  'billing_provider_tax_id',
  'billing_provider_ssn',
  'billing_provider_taxonomy',
  'billing_provider_upin',
  'billing_provider_state_license',
  'billing_provider_state',
  'billing_provider_address_line_1',
  'billing_provider_address_line_2',
  'billing_provider_city',
  'billing_provider_zip',
  'facility_name',
  'facility_npi',
  'facility_address',
  'rendering_provider_npi',
  'rendering_provider_first_name',
  'rendering_provider_middle_name',
  'rendering_provider_last_name',
  'rendering_provider_upin',
  'rendering_provider_state_license',
  'referring_provider_npi',
  'referring_provider_first_name',
  'referring_provider_middle_name',
  'referring_provider_last_name',
  'referring_provider_upin',
  'referring_provider_state_license',
  ...CLAIM_LEVEL_DATE_FIELDS.map((f) => f.key),
] as const;

function str(value: unknown): string {
  if (value == null) return '';
  return String(value);
}

function modifiersFromLine(line: ServiceLineSummary): string {
  return [line.modifier_1, line.modifier_2, line.modifier_3, line.modifier_4]
    .filter(Boolean)
    .join(',');
}

function pointersFromLine(line: ServiceLineSummary): string {
  const raw = line.diagnosis_pointers;
  if (Array.isArray(raw)) return raw.join(',');
  if (raw == null) return '';
  return String(raw);
}

function claimToForm(claim: ClaimSummary): FormState {
  const form: FormState = {};
  for (const key of TEXT_FIELDS) {
    form[key] = str((claim as Record<string, unknown>)[key]);
  }
  return form;
}

function linesFromClaim(claim: ClaimSummary): LineDraft[] {
  const lines: LineDraft[] = (claim.service_lines ?? []).map((line) => ({
    id: line.id,
    line_number: line.line_number,
    procedure_code: str(line.procedure_code),
    ndc_code: str(line.ndc_code),
    ndc_quantity: line.ndc_quantity == null ? '' : String(line.ndc_quantity),
    ndc_unit: str(line.ndc_unit),
    service_date_from: str(line.service_date_from),
    service_date_to: str(line.service_date_to),
    modifiers: modifiersFromLine(line),
    diagnosis_pointers: pointersFromLine(line),
    units: String(line.units ?? 1),
    unit_scale: str(line.unit_scale || 'UN'),
    referring_provider_npi: str(line.referring_provider_npi),
    referring_provider_last_name: str(line.referring_provider_last_name),
    other_payer_paid_amount:
      line.other_payer_paid_amount == null ? '' : String(line.other_payer_paid_amount),
  }));
  if (lines.length < 20) {
    const next = (lines.reduce((max, l) => Math.max(max, l.line_number), 0) || 0) + 1;
    lines.push({
      line_number: next,
      procedure_code: '',
      ndc_code: '',
      ndc_quantity: '',
      ndc_unit: '',
      service_date_from: '',
      service_date_to: '',
      modifiers: '',
      diagnosis_pointers: '1',
      units: '1',
      unit_scale: 'UN',
      referring_provider_npi: '',
      referring_provider_last_name: '',
      other_payer_paid_amount: '',
      isNew: true,
    });
  }
  return lines;
}

function diagnosesFromClaim(claim: ClaimSummary): DiagnosisDraft[] {
  const rows: DiagnosisDraft[] = (claim.diagnoses ?? []).map((d: ClaimDiagnosis) => ({
    id: d.id,
    sequence: d.sequence,
    code: d.code,
    description: str(d.description),
  }));
  if (rows.length < 12) {
    rows.push({
      sequence: rows.length + 1,
      code: '',
      description: '',
    });
  }
  return rows;
}

function cobFromClaim(claim: ClaimSummary): CobDraft[] {
  const raw = claim.other_subscribers;
  const list = Array.isArray(raw) ? raw : [];
  const rows = list.map((entry: OtherSubscriberRow) => {
    const e = entry as Record<string, unknown>;
    return {
      member_id: str(e.member_id ?? e.memberId),
      group_number: str(e.group_number ?? e.groupNumber),
      group_name: str(e.group_name ?? e.groupName),
      ssn: str(e.ssn),
      claim_filing_indicator: str(e.claim_filing_indicator ?? e.claimFilingIndicator),
      payer_name: str(e.payer_name ?? e.payerName),
      remittance_date: str(e.remittance_date ?? e.remittanceDate).slice(0, 10),
      payer_claim_control_number: str(
        e.payer_claim_control_number ?? e.payerClaimControlNumber,
      ),
      payer_paid_amount: (() => {
        const v = e.payer_paid_amount ?? e.payerPaidAmount ?? e.paidAmount;
        return v == null || v === '' ? '' : String(v);
      })(),
      remaining_patient_liability: (() => {
        const v = e.remaining_patient_liability ?? e.remainingPatientLiability;
        return v == null || v === '' ? '' : String(v);
      })(),
    };
  });
  return rows.length > 0 ? rows : [{ ...EMPTY_COB }];
}

function cobHasContent(row: CobDraft): boolean {
  return Object.values(row).some((v) => v.trim() !== '');
}

function asValidationIssues(raw: unknown): ValidationIssue[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is ValidationIssue => !!item && typeof item === 'object');
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-xs font-medium text-slate-600">{children}</label>;
}

const inputClass =
  'w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500';

function TextInput({
  label,
  value,
  onChange,
  type = 'text',
  maxLength,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        <option value="">Select</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border-t border-slate-200 pt-6 first:border-t-0 first:pt-0">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {children}
    </section>
  );
}

export function ClaimDetail({ claimId, basePath }: ClaimDetailProps) {
  const user = useAuthStore((s) => s.user);
  const canValidate = canUploadOrValidate(user);
  const [claim, setClaim] = useState<ClaimSummary | null>(null);
  const [form, setForm] = useState<FormState>({});
  const [diagnoses, setDiagnoses] = useState<DiagnosisDraft[]>([]);
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [cobRows, setCobRows] = useState<CobDraft[]>([{ ...EMPTY_COB }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<'success' | 'warning'>('success');
  const [openModal, setOpenModal] = useState<ValidationModalName | null>(null);

  const applyClaim = useCallback((next: ClaimSummary) => {
    setClaim(next);
    setForm(claimToForm(next));
    setDiagnoses(diagnosesFromClaim(next));
    setLines(linesFromClaim(next));
    setCobRows(cobFromClaim(next));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      applyClaim(await getClaim(claimId));
    } catch (err) {
      setError(friendlyError(err));
      setClaim(null);
    } finally {
      setLoading(false);
    }
  }, [applyClaim, claimId]);

  useEffect(() => {
    void load();
  }, [load]);

  const setField = useCallback((key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const validationIssues = useMemo(
    () => asValidationIssues(claim?.validation_errors),
    [claim?.validation_errors],
  );

  const errorLineNumbers = useMemo(() => {
    const set = new Set<number>();
    for (const issue of validationIssues) {
      if ((issue.severity ?? 'error') !== 'error') continue;
      const match = /^service_lines\.(\d+)\./.exec(issue.field ?? '');
      if (match) set.add(Number(match[1]));
    }
    return set;
  }, [validationIssues]);

  const relationshipOptions = useMemo(() => {
    const opts = optionEntries(RELATIONSHIP_OPTIONS);
    const current = form.subscriber_relationship?.toUpperCase();
    if (current && !RELATIONSHIP_OPTIONS[current]) {
      opts.unshift({ value: current, label: `${current} - From claim / EDI` });
    }
    return opts;
  }, [form.subscriber_relationship]);

  function updateLine(index: number, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  function updateDiagnosis(index: number, patch: Partial<DiagnosisDraft>) {
    setDiagnoses((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function updateCob(index: number, patch: Partial<CobDraft>) {
    setCobRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function onSaveAndValidate() {
    if (!claim) return;
    setBusy(true);
    setMessage(null);
    try {
      const existingDiagnoses = diagnoses
        .filter((d) => d.id != null && d.code.trim())
        .map((d) => ({ id: d.id, code: d.code.trim(), sequence: d.sequence }));
      const newDiagnoses = diagnoses
        .filter((d) => d.id == null && d.code.trim())
        .map((d) => ({ code: d.code.trim(), sequence: d.sequence }));

      const existingLines = lines
        .filter((l) => l.id != null)
        .map((l) => ({
          id: l.id,
          line_number: l.line_number,
          procedure_code: l.procedure_code,
          ndc_code: l.ndc_code || null,
          ndc_quantity: l.ndc_quantity === '' ? null : l.ndc_quantity,
          ndc_unit: l.ndc_unit || null,
          service_date_from: l.service_date_from || null,
          service_date_to: l.service_date_to || null,
          modifiers: l.modifiers,
          diagnosis_pointers: l.diagnosis_pointers,
          units: l.units,
          unit_scale: l.unit_scale || 'UN',
          referring_provider_npi: l.referring_provider_npi || null,
          referring_provider_last_name: l.referring_provider_last_name || null,
          other_payer_paid_amount: l.other_payer_paid_amount === '' ? null : l.other_payer_paid_amount,
        }));

      const newLines = lines
        .filter((l) => l.isNew && l.procedure_code.trim())
        .map((l) => ({
          procedure_code: l.procedure_code.trim(),
          ndc_code: l.ndc_code || null,
          ndc_quantity: l.ndc_quantity === '' ? null : l.ndc_quantity,
          ndc_unit: l.ndc_unit || null,
          service_date_from: l.service_date_from || null,
          service_date_to: l.service_date_to || null,
          modifiers: l.modifiers,
          diagnosis_pointers: l.diagnosis_pointers || '1',
          units: l.units || '1',
          unit_scale: l.unit_scale || 'UN',
          referring_provider_npi: l.referring_provider_npi || null,
          referring_provider_last_name: l.referring_provider_last_name || null,
          other_payer_paid_amount: l.other_payer_paid_amount === '' ? null : l.other_payer_paid_amount,
        }));

      const dateKeys = new Set(CLAIM_LEVEL_DATE_FIELDS.map((f) => f.key));
      dateKeys.add('subscriber_dob');
      dateKeys.add('patient_dob');

      const claimFields: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(form)) {
        if (dateKeys.has(key) && value === '') {
          claimFields[key] = null;
        } else {
          claimFields[key] = value;
        }
      }

      const otherSubscribers = cobRows
        .filter(cobHasContent)
        .map((row) => ({
          member_id: row.member_id || null,
          group_number: row.group_number || null,
          group_name: row.group_name || null,
          ssn: row.ssn || null,
          claim_filing_indicator: row.claim_filing_indicator || null,
          payer_name: row.payer_name || null,
          remittance_date: row.remittance_date || null,
          payer_claim_control_number: row.payer_claim_control_number || null,
          payer_paid_amount: row.payer_paid_amount === '' ? null : row.payer_paid_amount,
          remaining_patient_liability:
            row.remaining_patient_liability === '' ? null : row.remaining_patient_liability,
        }));

      const payload: Record<string, unknown> = {
        ...claimFields,
        diagnoses: existingDiagnoses,
        new_diagnoses: newDiagnoses,
        lines: existingLines,
        new_lines: newLines,
        other_subscribers: otherSubscribers,
      };

      await updateClaim(claimId, payload);

      if (!canValidate) {
        setMessage('Claim saved successfully. Validation is unavailable until your subscription is renewed.');
        setMessageTone('warning');
        applyClaim(await getClaim(claimId));
        return;
      }

      const result = await validateClaim(claimId);

      let msg = 'Claim saved and validation complete.';
      let tone: 'success' | 'warning' = 'success';
      switch (result.status) {
        case 'valid':
          msg = 'Claim saved and validated successfully. No errors found.';
          tone = 'success';
          break;
        case 'warning':
          msg = `Claim saved. Validation found ${result.warning_count ?? 0} warning(s).`;
          tone = 'warning';
          break;
        case 'error':
          msg = `Claim saved. Validation found ${result.error_count ?? 0} error(s).`;
          tone = 'warning';
          break;
        default:
          break;
      }
      setMessage(msg);
      setMessageTone(tone);
      applyClaim(await getClaim(claimId));
    } catch (err) {
      setMessage(friendlyError(err));
      setMessageTone('warning');
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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void onSaveAndValidate();
            }}
            className="space-y-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Edit Claim: {claim.claim_id}</h2>
                <p className="mt-1 text-sm text-slate-600">Claim #{claim.id}</p>
                <div className="mt-2">
                  <ClaimStatusBadge status={claim.status} />
                </div>
              </div>
            </div>

            {message ? (
              <p
                className={
                  messageTone === 'success'
                    ? 'rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800'
                    : 'rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900'
                }
                role="status"
              >
                {message}
              </p>
            ) : null}

            {validationIssues.length > 0 ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                <h4 className="mb-3 font-semibold text-rose-800">
                  Validation Issues ({validationIssues.length})
                </h4>
                <ul className="space-y-1.5">
                  {validationIssues.map((issue, idx) => {
                    const severity = issue.severity ?? 'error';
                    const badge =
                      severity === 'error'
                        ? 'bg-rose-200 text-rose-800'
                        : severity === 'info'
                          ? 'bg-sky-200 text-sky-800'
                          : 'bg-amber-200 text-amber-800';
                    const label =
                      severity === 'error' ? 'ERROR' : severity === 'info' ? 'INFO' : 'WARN';
                    const showNcciHelp = Boolean(issue.help_text);
                    const showCerumen =
                      issue.policy_modal === 'cerumen-plan-policy';
                    return (
                      <li key={`${issue.field ?? 'f'}-${idx}`} className="flex items-start gap-2 text-sm">
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${badge}`}>
                          {label}
                        </span>
                        <span className="text-slate-700">
                          <strong>
                            {issue.field ?? 'Unknown'}
                            {issue.rule ? ` (${issue.rule})` : ''}:
                          </strong>{' '}
                          {issue.message ?? 'Validation failed'}
                          {showNcciHelp ? (
                            <>
                              {' '}
                              <button
                                type="button"
                                className="font-medium text-slate-900 underline"
                                onClick={() => setOpenModal('ncci-bypass-modifiers')}
                              >
                                Click here
                              </button>
                            </>
                          ) : null}
                          {showCerumen ? (
                            <>
                              {' '}
                              <button
                                type="button"
                                className="font-medium text-slate-900 underline"
                                onClick={() => setOpenModal('cerumen-plan-policy')}
                              >
                                Click here
                              </button>
                            </>
                          ) : null}
                          {issue.details_url ? (
                            <>
                              {' '}
                              <a
                                href={issue.details_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-900 underline"
                              >
                                details
                              </a>
                            </>
                          ) : null}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            <div className="space-y-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <Section title="Patient Demographics">
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                  <TextInput
                    label="Subscriber Last Name"
                    value={form.subscriber_last_name}
                    onChange={(v) => setField('subscriber_last_name', v)}
                    maxLength={100}
                  />
                  <TextInput
                    label="Subscriber First Name"
                    value={form.subscriber_first_name}
                    onChange={(v) => setField('subscriber_first_name', v)}
                    maxLength={100}
                  />
                  <TextInput
                    label="Patient Last Name"
                    value={form.patient_last_name}
                    onChange={(v) => setField('patient_last_name', v)}
                    maxLength={100}
                  />
                  <TextInput
                    label="Patient First Name"
                    value={form.patient_first_name}
                    onChange={(v) => setField('patient_first_name', v)}
                    maxLength={100}
                  />
                  <TextInput
                    label="Subscriber Birth Date"
                    type="date"
                    value={form.subscriber_dob}
                    onChange={(v) => setField('subscriber_dob', v)}
                  />
                  <TextInput
                    label="Patient Birth Date"
                    type="date"
                    value={form.patient_dob}
                    onChange={(v) => setField('patient_dob', v)}
                  />
                  <TextInput
                    label="Member ID"
                    value={form.subscriber_member_id}
                    onChange={(v) => setField('subscriber_member_id', v)}
                  />
                  <TextInput
                    label="Subscriber Group Number"
                    value={form.subscriber_group_number}
                    onChange={(v) => setField('subscriber_group_number', v)}
                  />
                  <TextInput
                    label="Subscriber Group Name"
                    value={form.subscriber_group_name}
                    onChange={(v) => setField('subscriber_group_name', v)}
                  />
                  <TextInput
                    label="SSN"
                    value={form.subscriber_ssn}
                    onChange={(v) => setField('subscriber_ssn', v)}
                    maxLength={11}
                    placeholder="9 digits, no dashes"
                  />
                  <SelectField
                    label="Gender"
                    value={form.subscriber_gender}
                    onChange={(v) => setField('subscriber_gender', v)}
                    options={GENDER_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                  />
                  <SelectField
                    label="Place of Service"
                    value={form.place_of_service}
                    onChange={(v) => setField('place_of_service', v)}
                    options={optionEntries(PLACES_OF_SERVICE)}
                  />
                  <TextInput
                    label="Related Causes (CLM11)"
                    value={form.related_causes_code}
                    onChange={(v) => setField('related_causes_code', v)}
                    maxLength={50}
                    placeholder="e.g. AA, OA, or AA:OA"
                  />
                  <TextInput
                    label="Delay Reason Code (CLM20)"
                    value={form.delay_reason_code}
                    onChange={(v) => setField('delay_reason_code', v)}
                    maxLength={2}
                  />
                  <SelectField
                    label="Submission Method"
                    value={form.submission_method}
                    onChange={(v) => setField('submission_method', v)}
                    options={SUBMISSION_METHOD_OPTIONS.map((o) => ({
                      value: o.value,
                      label: o.label,
                    }))}
                  />
                  <TextInput
                    label="Payer ID"
                    value={form.payer_id}
                    onChange={(v) => setField('payer_id', v)}
                  />
                  <TextInput
                    label="Payer Name"
                    value={form.payer_name}
                    onChange={(v) => setField('payer_name', v)}
                  />
                  <SelectField
                    label="Payer Responsibility (SBR01)"
                    value={form.payer_responsibility}
                    onChange={(v) => setField('payer_responsibility', v)}
                    options={optionEntries(PAYER_RESPONSIBILITY_OPTIONS)}
                  />
                  <SelectField
                    label="Subscriber Relationship Code"
                    value={form.subscriber_relationship}
                    onChange={(v) => setField('subscriber_relationship', v)}
                    options={relationshipOptions}
                  />
                  <SelectField
                    label="Filing Indicator"
                    value={form.claim_filing_indicator}
                    onChange={(v) => setField('claim_filing_indicator', v)}
                    options={optionEntries(CLAIM_FILING_INDICATORS)}
                  />
                  <TextInput
                    label="Insurance Type Code"
                    value={form.insurance_type_code}
                    onChange={(v) => setField('insurance_type_code', v)}
                    maxLength={3}
                  />
                  <TextInput
                    label="Prior Authorization"
                    value={form.prior_auth_number}
                    onChange={(v) => setField('prior_auth_number', v)}
                    maxLength={50}
                  />
                  <TextInput
                    label="Referral Number"
                    value={form.referral_number}
                    onChange={(v) => setField('referral_number', v)}
                    maxLength={50}
                  />
                  <TextInput
                    label="CLIA Number (REF*X4)"
                    value={form.clia_number}
                    onChange={(v) => setField('clia_number', v)}
                    maxLength={20}
                    placeholder="NNANNNNNNN e.g. 12D4567890"
                  />
                  <TextInput
                    label="Mammography Certification (REF*EW)"
                    value={form.mammography_certification_number}
                    onChange={(v) => setField('mammography_certification_number', v)}
                    maxLength={50}
                  />
                </div>
              </Section>

              <Section title="Other Subscriber (COB)">
                {cobRows.map((row, index) => (
                  <div key={`cob-${index}`} className={index > 0 ? 'mt-4' : undefined}>
                    {index > 0 ? (
                      <h4 className="mb-3 text-sm font-semibold text-slate-800">
                        Other Subscriber #{index + 1}
                      </h4>
                    ) : null}
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                      <TextInput
                        label="Member ID"
                        value={row.member_id}
                        onChange={(v) => updateCob(index, { member_id: v })}
                      />
                      <TextInput
                        label="Subscriber Group Number"
                        value={row.group_number}
                        onChange={(v) => updateCob(index, { group_number: v })}
                      />
                      <TextInput
                        label="Subscriber Group Name"
                        value={row.group_name}
                        onChange={(v) => updateCob(index, { group_name: v })}
                      />
                      <TextInput
                        label="SSN"
                        value={row.ssn}
                        onChange={(v) => updateCob(index, { ssn: v })}
                        maxLength={11}
                        placeholder="9 digits, no dashes"
                      />
                      <SelectField
                        label="Filing Indicator (SBR09)"
                        value={row.claim_filing_indicator}
                        onChange={(v) => updateCob(index, { claim_filing_indicator: v })}
                        options={optionEntries(CLAIM_FILING_INDICATORS)}
                      />
                      <TextInput
                        label="Other Payer Name (2330B NM103)"
                        value={row.payer_name}
                        onChange={(v) => updateCob(index, { payer_name: v })}
                        maxLength={60}
                        placeholder="e.g. MEDICARE"
                      />
                      <TextInput
                        label="Remittance Date (DTP*573)"
                        type="date"
                        value={row.remittance_date}
                        onChange={(v) => updateCob(index, { remittance_date: v })}
                      />
                      <TextInput
                        label="Medicare ICN (2330B REF*F8)"
                        value={row.payer_claim_control_number}
                        onChange={(v) => updateCob(index, { payer_claim_control_number: v })}
                        maxLength={50}
                        placeholder="Other payer claim control number"
                      />
                      <TextInput
                        label="Payer Paid Amount (AMT*D)"
                        type="number"
                        value={row.payer_paid_amount}
                        onChange={(v) => updateCob(index, { payer_paid_amount: v })}
                        placeholder="0.00"
                      />
                      <TextInput
                        label="Patient Liability (AMT*EAF)"
                        type="number"
                        value={row.remaining_patient_liability}
                        onChange={(v) => updateCob(index, { remaining_patient_liability: v })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                ))}
                <div className="mt-3">
                  <button
                    type="button"
                    className="text-sm font-medium text-slate-700 underline-offset-2 hover:underline"
                    onClick={() => setCobRows((prev) => [...prev, { ...EMPTY_COB }])}
                  >
                    + Add other subscriber
                  </button>
                </div>
              </Section>

              <Section title="Billing Provider Information">
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  <div className="md:col-span-3">
                    <TextInput
                      label="Billing Provider Name"
                      value={form.billing_provider_name}
                      onChange={(v) => setField('billing_provider_name', v)}
                      maxLength={255}
                    />
                  </div>
                  <TextInput
                    label="Billing Provider NPI"
                    value={form.billing_provider_npi}
                    onChange={(v) => setField('billing_provider_npi', v)}
                  />
                  <TextInput
                    label="Tax ID"
                    value={form.billing_provider_tax_id}
                    onChange={(v) => setField('billing_provider_tax_id', v)}
                    maxLength={15}
                  />
                  <TextInput
                    label="Billing Provider SSN"
                    value={form.billing_provider_ssn}
                    onChange={(v) => setField('billing_provider_ssn', v)}
                    maxLength={11}
                  />
                  <TextInput
                    label="Taxonomy Code"
                    value={form.billing_provider_taxonomy}
                    onChange={(v) => setField('billing_provider_taxonomy', v)}
                  />
                  <TextInput
                    label="UPIN"
                    value={form.billing_provider_upin}
                    onChange={(v) => setField('billing_provider_upin', v)}
                    maxLength={30}
                  />
                  <TextInput
                    label="State License"
                    value={form.billing_provider_state_license}
                    onChange={(v) => setField('billing_provider_state_license', v)}
                    maxLength={50}
                  />
                  <TextInput
                    label="State"
                    value={form.billing_provider_state}
                    onChange={(v) => setField('billing_provider_state', v)}
                    maxLength={2}
                  />
                  <div className="md:col-span-3">
                    <TextInput
                      label="Address Line 1"
                      value={form.billing_provider_address_line_1}
                      onChange={(v) => setField('billing_provider_address_line_1', v)}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <TextInput
                      label="Address Line 2"
                      value={form.billing_provider_address_line_2}
                      onChange={(v) => setField('billing_provider_address_line_2', v)}
                    />
                  </div>
                  <TextInput
                    label="City"
                    value={form.billing_provider_city}
                    onChange={(v) => setField('billing_provider_city', v)}
                  />
                  <TextInput
                    label="ZIP"
                    value={form.billing_provider_zip}
                    onChange={(v) => setField('billing_provider_zip', v)}
                  />
                </div>
              </Section>

              <Section title="Service Location">
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  <TextInput
                    label="Service Location Name"
                    value={form.facility_name}
                    onChange={(v) => setField('facility_name', v)}
                  />
                  <TextInput
                    label="Service Location NPI"
                    value={form.facility_npi}
                    onChange={(v) => setField('facility_npi', v)}
                    maxLength={10}
                  />
                  <TextInput
                    label="Service Location Address"
                    value={form.facility_address}
                    onChange={(v) => setField('facility_address', v)}
                  />
                </div>
              </Section>

              <Section title="Rendering Provider">
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                  <TextInput
                    label="Rendering Provider NPI"
                    value={form.rendering_provider_npi}
                    onChange={(v) => setField('rendering_provider_npi', v)}
                    maxLength={10}
                  />
                  <TextInput
                    label="First Name"
                    value={form.rendering_provider_first_name}
                    onChange={(v) => setField('rendering_provider_first_name', v)}
                  />
                  <TextInput
                    label="Middle Name"
                    value={form.rendering_provider_middle_name}
                    onChange={(v) => setField('rendering_provider_middle_name', v)}
                  />
                  <TextInput
                    label="Last Name"
                    value={form.rendering_provider_last_name}
                    onChange={(v) => setField('rendering_provider_last_name', v)}
                  />
                  <TextInput
                    label="UPIN"
                    value={form.rendering_provider_upin}
                    onChange={(v) => setField('rendering_provider_upin', v)}
                    maxLength={30}
                  />
                  <TextInput
                    label="State License"
                    value={form.rendering_provider_state_license}
                    onChange={(v) => setField('rendering_provider_state_license', v)}
                    maxLength={50}
                  />
                </div>
              </Section>

              <Section title="Referring Provider Information">
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                  <TextInput
                    label="Referring Provider NPI"
                    value={form.referring_provider_npi}
                    onChange={(v) => setField('referring_provider_npi', v)}
                    maxLength={10}
                  />
                  <TextInput
                    label="First Name"
                    value={form.referring_provider_first_name}
                    onChange={(v) => setField('referring_provider_first_name', v)}
                  />
                  <TextInput
                    label="Middle Name"
                    value={form.referring_provider_middle_name}
                    onChange={(v) => setField('referring_provider_middle_name', v)}
                  />
                  <TextInput
                    label="Last Name"
                    value={form.referring_provider_last_name}
                    onChange={(v) => setField('referring_provider_last_name', v)}
                  />
                  <TextInput
                    label="UPIN"
                    value={form.referring_provider_upin}
                    onChange={(v) => setField('referring_provider_upin', v)}
                    maxLength={30}
                  />
                  <TextInput
                    label="State License"
                    value={form.referring_provider_state_license}
                    onChange={(v) => setField('referring_provider_state_license', v)}
                    maxLength={50}
                  />
                </div>
              </Section>

              <Section title="Claim Level Dates">
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                  {CLAIM_LEVEL_DATE_FIELDS.map((field) => (
                    <TextInput
                      key={field.key}
                      label={field.label}
                      type="date"
                      value={form[field.key] ?? ''}
                      onChange={(v) => setField(field.key, v)}
                    />
                  ))}
                </div>
              </Section>

              <Section title="Diagnosis">
                <div className="space-y-2">
                  {diagnoses.map((dx, index) => (
                    <div key={dx.id ?? `new-${index}`} className="flex flex-wrap items-center gap-2">
                      <span className="w-6 text-sm text-slate-400">{dx.sequence}</span>
                      <input
                        type="text"
                        value={dx.code}
                        placeholder={dx.id ? 'Code' : 'Search Code'}
                        onChange={(e) => updateDiagnosis(index, { code: e.target.value })}
                        className={`${inputClass} w-28`}
                      />
                      <input
                        type="text"
                        value={dx.description}
                        placeholder="Description (display only)"
                        onChange={(e) => updateDiagnosis(index, { description: e.target.value })}
                        className={`${inputClass} min-w-[12rem] flex-1`}
                      />
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Procedure">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[72rem] border-separate border-spacing-0 text-sm">
                    <thead>
                      <tr className="border-b text-xs text-slate-600">
                        <th className="px-1 pb-2 text-center font-medium">#</th>
                        <th className="px-1 pb-2 text-left font-medium">Procedure Code</th>
                        <th className="px-1 pb-2 text-left font-medium">NDC</th>
                        <th className="px-1 pb-2 text-left font-medium">NDC Qty</th>
                        <th className="px-1 pb-2 text-left font-medium">NDC Unit</th>
                        <th className="px-1 pb-2 text-left font-medium">Service Date From</th>
                        <th className="px-1 pb-2 text-left font-medium">Service Date To</th>
                        <th className="px-1 pb-2 text-left font-medium">Modifiers</th>
                        <th className="px-1 pb-2 text-left font-medium">Dx Pointers</th>
                        <th className="px-1 pb-2 text-left font-medium">Units</th>
                        <th className="px-1 pb-2 text-left font-medium">Unit Scale</th>
                        <th className="px-1 pb-2 text-left font-medium">Ref NPI</th>
                        <th className="px-1 pb-2 text-left font-medium">Ref Last Name</th>
                        <th className="px-1 pb-2 text-left font-medium">SVD02 Paid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line, index) => (
                        <tr
                          key={line.id ?? `new-line-${index}`}
                          className={
                            errorLineNumbers.has(line.line_number)
                              ? 'bg-rose-50'
                              : line.isNew
                                ? 'bg-slate-50'
                                : undefined
                          }
                        >
                          <td className="px-1 py-1.5 text-center text-xs text-slate-500">
                            {line.line_number}
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              className={inputClass}
                              value={line.procedure_code}
                              placeholder="Enter CPT"
                              onChange={(e) =>
                                updateLine(index, { procedure_code: e.target.value })
                              }
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              className={`${inputClass} font-mono`}
                              value={line.ndc_code}
                              placeholder="00000-0000-00"
                              onChange={(e) => updateLine(index, { ndc_code: e.target.value })}
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              type="number"
                              step="0.001"
                              className={inputClass}
                              value={line.ndc_quantity}
                              onChange={(e) => updateLine(index, { ndc_quantity: e.target.value })}
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <select
                              className={inputClass}
                              value={line.ndc_unit}
                              onChange={(e) => updateLine(index, { ndc_unit: e.target.value })}
                            >
                              <option value="">—</option>
                              {NDC_UNIT_OPTIONS.map((u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              type="date"
                              className={inputClass}
                              value={line.service_date_from}
                              onChange={(e) =>
                                updateLine(index, { service_date_from: e.target.value })
                              }
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              type="date"
                              className={inputClass}
                              value={line.service_date_to}
                              onChange={(e) =>
                                updateLine(index, { service_date_to: e.target.value })
                              }
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              className={inputClass}
                              value={line.modifiers}
                              placeholder="e.g. 25,59"
                              onChange={(e) => updateLine(index, { modifiers: e.target.value })}
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              className={inputClass}
                              value={line.diagnosis_pointers}
                              onChange={(e) =>
                                updateLine(index, { diagnosis_pointers: e.target.value })
                              }
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              type="number"
                              step="0.01"
                              className={inputClass}
                              value={line.units}
                              onChange={(e) => updateLine(index, { units: e.target.value })}
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <select
                              className={inputClass}
                              value={line.unit_scale}
                              onChange={(e) => updateLine(index, { unit_scale: e.target.value })}
                            >
                              {UNIT_SCALE_OPTIONS.map((u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              className={inputClass}
                              maxLength={10}
                              value={line.referring_provider_npi}
                              placeholder="NPI"
                              onChange={(e) =>
                                updateLine(index, { referring_provider_npi: e.target.value })
                              }
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              className={inputClass}
                              maxLength={100}
                              value={line.referring_provider_last_name}
                              placeholder="Last name"
                              onChange={(e) =>
                                updateLine(index, {
                                  referring_provider_last_name: e.target.value,
                                })
                              }
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              type="number"
                              step="0.01"
                              className={inputClass}
                              value={line.other_payer_paid_amount}
                              placeholder="0.00"
                              onChange={(e) =>
                                updateLine(index, { other_payer_paid_amount: e.target.value })
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>

              <div className="flex items-center justify-center gap-3 border-t border-slate-200 pt-4">
                <Link
                  href={`${basePath}/batches/${claim.batch_file_id}`}
                  className="rounded-md bg-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-300"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {busy ? 'Saving…' : canValidate ? 'Validate' : 'Save'}
                </button>
              </div>
            </div>
          </form>
        ) : null}
      </AsyncState>
      <ValidationIssueModals open={openModal} onClose={() => setOpenModal(null)} />
    </div>
  );
}
