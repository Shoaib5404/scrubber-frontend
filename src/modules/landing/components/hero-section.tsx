import Link from 'next/link';
import { BrandLogo } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { BRAND_NAME } from '@/lib/brand';
import { HERO } from '../content';
import { WorkflowPreview } from './workflow-preview';

export function HeroSection() {
  return (
    <section
      className="landing-hero relative overflow-hidden"
      aria-labelledby="landing-hero-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_-10%,color-mix(in_oklch,var(--primary)_22%,transparent),transparent),linear-gradient(180deg,#e7f2f1_0%,var(--background)_55%,var(--background)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,color-mix(in_oklch,var(--foreground)_6%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklch,var(--foreground)_6%,transparent)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(180deg,black,transparent_85%)]"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-12 lg:px-8 lg:pb-24">
        <div className="landing-reveal max-w-xl">
          <BrandLogo
            variant="logo"
            priority
            className="mb-6 h-12 w-auto sm:h-14"
            alt={BRAND_NAME}
          />
          <h1
            id="landing-hero-heading"
            className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
          >
            {HERO.headline}
          </h1>
          <p className="mt-4 max-w-prose text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {HERO.support}
          </p>
          <p className="mt-3 font-mono text-xs text-primary sm:text-sm">
            {HERO.scope}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" asChild>
              <a href="#demo">Request a demo</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Or{' '}
            <a
              href="#how-it-works"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              explore how it works
            </a>
            .
          </p>
        </div>

        <div className="landing-reveal landing-reveal-delay">
          <WorkflowPreview />
        </div>
      </div>
    </section>
  );
}
