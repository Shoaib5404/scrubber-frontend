import Image from 'next/image';
import { CheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PACKAGES } from '../content';

export function PackagesSection() {
  return (
    <section
      id="packages"
      className="scroll-mt-20 border-y border-border bg-[linear-gradient(180deg,var(--background),color-mix(in_oklch,var(--primary)_5%,var(--background)))] py-16 sm:py-20"
      aria-labelledby="packages-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2
            id="packages-heading"
            className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            Subscription packages
          </h2>
          <p className="mt-3 text-muted-foreground">
            Plans align with how Neo Scrubber provisions organizations today
            (Basic, Pro, Enterprise). Exact entitlements and commercial terms
            are confirmed during onboarding—we do not publish list prices here.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {PACKAGES.map((pkg) => (
            <article
              key={pkg.id}
              className={`flex flex-col rounded-2xl border bg-card p-6 shadow-xs ${
                pkg.highlighted
                  ? 'border-primary ring-1 ring-primary/25'
                  : 'border-border'
              }`}
            >
              <p
                className={`mb-3 text-xs font-medium ${
                  pkg.highlighted ? 'text-primary' : 'invisible'
                }`}
                aria-hidden={!pkg.highlighted}
              >
                Most requested
              </p>
              <h3 className="text-xl font-semibold text-foreground">
                {pkg.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {pkg.summary}
              </p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {pkg.includes.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <CheckIcon
                      className="mt-0.5 size-4 shrink-0 text-primary"
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-6 w-full"
                variant={pkg.highlighted ? 'default' : 'outline'}
                asChild
              >
                <a href="#demo">Discuss {pkg.name}</a>
              </Button>
            </article>
          ))}
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-border">
          <div className="relative aspect-[21/7] min-h-[140px] bg-muted">
            <Image
              src="/landing/secure-ops.jpg"
              alt="Secure laptop workspace representing subscription-protected portal access"
              fill
              sizes="(max-width: 1024px) 100vw, 1152px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,28,36,0.82),rgba(15,28,36,0.35))]" />
            <div className="absolute inset-0 flex items-center px-6 sm:px-10">
              <div className="max-w-lg text-white">
                <p className="text-lg font-semibold sm:text-xl">
                  Feature flags follow your subscription
                </p>
                <p className="mt-2 text-sm text-white/85">
                  Web upload, API credentials, and reference scopes are enabled
                  per tenant—so your team only sees what your package includes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
