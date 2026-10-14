import { SECURITY_POINTS } from '../content';

export function SecuritySection() {
  return (
    <section
      id="security"
      className="scroll-mt-20 py-16 sm:py-20"
      aria-labelledby="security-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <h2
              id="security-heading"
              className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
            >
              Security &amp; data handling
            </h2>
            <p className="mt-3 text-muted-foreground">
              We describe controls that exist in the product today. This page
              does not claim HIPAA certification, SOC 2, or other attestations
              unless separately documented for your organization.
            </p>
          </div>
          <ul className="space-y-6">
            {SECURITY_POINTS.map((point) => (
              <li
                key={point.title}
                className="border-b border-border pb-6 last:border-0 last:pb-0"
              >
                <h3 className="text-base font-semibold text-foreground">
                  {point.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {point.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
