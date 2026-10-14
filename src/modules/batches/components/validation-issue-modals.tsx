'use client';

import type { ReactNode } from 'react';
import {
  CERUMEN_ALLOWED_ICD_DISPLAY,
  CERUMEN_REMOVAL_PROCEDURE_CODES,
  NCCI_BYPASS_HELP_INTRO,
  NCCI_BYPASS_MODIFIERS,
} from '../claim-form-options';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type ValidationModalName = 'ncci-bypass-modifiers' | 'cerumen-plan-policy';

type ValidationIssueModalsProps = {
  open: ValidationModalName | null;
  onClose: () => void;
};

export function ValidationIssueModals({ open, onClose }: ValidationIssueModalsProps) {
  return (
    <Dialog open={open != null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {open === 'ncci-bypass-modifiers' ? <NcciBypassModalBody onClose={onClose} /> : null}
        {open === 'cerumen-plan-policy' ? <CerumenPolicyModalBody onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function ModalBody({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description ? <DialogDescription>{description}</DialogDescription> : null}
      </DialogHeader>
      {children}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </>
  );
}

function NcciBypassModalBody({ onClose }: { onClose: () => void }) {
  return (
    <ModalBody
      title="NCCI-associated modifiers"
      description={NCCI_BYPASS_HELP_INTRO}
      onClose={onClose}
    >
      <p className="text-center text-sm font-medium text-foreground">Approved modifier codes</p>
      <ul className="m-0 grid max-h-[min(50vh,20rem)] list-none grid-cols-3 gap-x-3 gap-y-1.5 overflow-y-auto p-0 font-mono text-sm text-foreground sm:grid-cols-4">
        {NCCI_BYPASS_MODIFIERS.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>
    </ModalBody>
  );
}

function CerumenPolicyModalBody({ onClose }: { onClose: () => void }) {
  return (
    <ModalBody
      title="Plan policy — impacted cerumen removal"
      description="When procedure codes for removal of impacted cerumen are billed, at least one claim diagnosis must be from the supportive ICD range below."
      onClose={onClose}
    >
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/50 p-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Applicable procedures
          </p>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0 font-mono text-sm text-foreground">
            {CERUMEN_REMOVAL_PROCEDURE_CODES.map((code) => (
              <li key={code} className="rounded border border-border bg-card px-2 py-0.5">
                {code}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Supportive diagnosis codes (H61.2–H61.23)
          </p>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0 font-mono text-sm text-foreground">
            {CERUMEN_ALLOWED_ICD_DISPLAY.map((code) => (
              <li key={code} className="rounded border border-border bg-card px-2 py-0.5">
                {code}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ModalBody>
  );
}
