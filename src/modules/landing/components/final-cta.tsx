import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FINAL_CTA } from '../content';
import { DemoRequestForm } from './demo-request-form';

export function FinalCTASection() {
  return (
    <section
      id="demo"
      className="scroll-mt-20 py-16 sm:py-20"
      aria-labelledby="demo-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-border bg-[linear-gradient(135deg,color-mix(in_oklch,var(--primary)_12%,var(--card)),var(--card)_45%,color-mix(in_oklch,var(--info)_8%,var(--card)))] px-6 py-10 sm:px-10 sm:py-12 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start lg:gap-14">
            <div>
              <h2
                id="demo-heading"
                className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
              >
                {FINAL_CTA.headline}
              </h2>
              <p className="mt-3 max-w-md text-muted-foreground">
                {FINAL_CTA.support}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="outline" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <a href="#packages">View packages</a>
                </Button>
              </div>
            </div>
            <DemoRequestForm />
          </div>
        </div>
      </div>
    </section>
  );
}
