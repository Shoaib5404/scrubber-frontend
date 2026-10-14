import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand';
import { BRAND_NAME } from '@/lib/brand';
import { PublicInquiryForm } from '@/modules/support/components/public-inquiry-form';

export const metadata: Metadata = {
  title: `Contact — ${BRAND_NAME}`,
  description: `Contact the ${BRAND_NAME} team about demos, pricing, or product questions.`,
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" aria-label={`${BRAND_NAME} home`}>
            <BrandLogo variant="logo" className="h-8 w-auto" />
          </Link>
          <Link
            href="/login"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-3xl font-semibold tracking-tight">Contact our team</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Have a question about our claims-scrubbing services, need help evaluating
          the platform, or want to discuss your organization&apos;s needs? Send a
          message and our team will follow up.
        </p>
        <div className="mt-8">
          <PublicInquiryForm defaultCategory="general" submitLabel="Send message" />
        </div>
      </main>
    </div>
  );
}
