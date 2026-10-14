import { HOW_STEPS } from '../content';

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-y border-border bg-[linear-gradient(180deg,color-mix(in_oklch,var(--primary)_6%,var(--background)),var(--background))] py-16 sm:py-20"
      aria-labelledby="how-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2
            id="how-heading"
            className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            How it works
          </h2>
          <p className="mt-3 text-muted-foreground">
            A connected workflow from file upload through claim-level review—
            using the same stages you see in the portal.
          </p>
        </div>

        <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {HOW_STEPS.map((step, i) => (
            <li key={step.step} className="relative">
              {i < HOW_STEPS.length - 1 ? (
                <span
                  className="pointer-events-none absolute top-8 left-[calc(50%+2.5rem)] hidden h-px w-[calc(100%-2rem)] bg-border lg:block"
                  aria-hidden
                />
              ) : null}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
                <p className="font-mono text-sm font-semibold text-primary">
                  {step.step}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
