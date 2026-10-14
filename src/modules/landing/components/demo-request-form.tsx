'use client';

import { PublicInquiryForm } from '@/modules/support/components/public-inquiry-form';

/** Landing “Request a Demo” — stores inquiry and emails staff admin when category is sales_demo. */
export function DemoRequestForm() {
  return (
    <PublicInquiryForm
      defaultCategory="sales_demo"
      submitLabel="Request a demo"
      title="Request a demo"
    />
  );
}
