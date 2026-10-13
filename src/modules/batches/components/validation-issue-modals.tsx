'use client';

import type { ReactNode } from 'react';
import {
  CERUMEN_ALLOWED_ICD_DISPLAY,
  CERUMEN_REMOVAL_PROCEDURE_CODES,
  NCCI_BYPASS_HELP_INTRO,
  NCCI_BYPASS_MODIFIERS,
} from '../claim-form-options';

export type ValidationModalName = 'ncci-bypass-modifiers' | 'cerumen-plan-policy';

type ValidationIssueModalsProps = {
  open: ValidationModalName | null;
  onClose: () => void;
};

export function ValidationIssueModals({ open, onClose }: ValidationIssueModalsProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${open}-title`}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {open === 'ncci-bypass-modifiers' ? <NcciBypassModalBody onClose={onClose} /> : null}
        {open === 'cerumen-plan-policy' ? <CerumenPolicyModalBody onClose={onClose} /> : null}
      </div>
    </div>
  );
}

function ModalChrome({
  id,
  title,
  onClose,
  children,
}: {
  id: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <h2 id={id} className="pr-4 text-lg font-semibold text-slate-900">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      {children}
      <div className="flex justify-end border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-300"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function NcciBypassModalBody({ onClose }: { onClose: () => void }) {
  return (
    <ModalChrome id="ncci-bypass-modifiers-title" title="NCCI-associated modifiers" onClose={onClose}>
      <p className="text-sm text-slate-600">{NCCI_BYPASS_HELP_INTRO}</p>
      <p className="mt-5 mb-4 text-center text-sm font-medium text-slate-800">Approved modifier codes</p>
      <ul className="m-0 grid max-h-[min(50vh,20rem)] list-none grid-cols-3 gap-x-3 gap-y-1.5 overflow-y-auto p-0 font-mono text-sm text-slate-900 sm:grid-cols-4">
        {NCCI_BYPASS_MODIFIERS.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>
    </ModalChrome>
  );
}

function CerumenPolicyModalBody({ onClose }: { onClose: () => void }) {
  return (
    <ModalChrome
      id="cerumen-plan-policy-title"
      title="Plan policy — impacted cerumen removal"
      onClose={onClose}
    >
      <p className="text-sm text-slate-600">
        When procedure codes for removal of impacted cerumen are billed, at least one claim diagnosis
        must be from the supportive ICD range below.
      </p>
      <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Applicable procedures
          </p>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0 font-mono text-sm text-slate-900">
            {CERUMEN_REMOVAL_PROCEDURE_CODES.map((code) => (
              <li key={code} className="rounded border border-slate-200 bg-white px-2 py-0.5">
                {code}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Supportive diagnosis codes (H61.2–H61.23)
          </p>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0 font-mono text-sm text-slate-900">
            {CERUMEN_ALLOWED_ICD_DISPLAY.map((code) => (
              <li key={code} className="rounded border border-slate-200 bg-white px-2 py-0.5">
                {code}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ModalChrome>
  );
}
