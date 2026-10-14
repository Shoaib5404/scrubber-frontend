import { VALUE_THEMES } from '../content';

export function ValuePropositionSection() {
  return (
    <section
      id="product"
      className="scroll-mt-20 py-16 sm:py-20"
      aria-labelledby="value-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2
            id="value-heading"
            className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            Clarity for every scrubbing step
          </h2>
          <p className="mt-3 text-muted-foreground">
            Built for billing specialists and revenue-cycle teams who need a
            reliable place to upload professional claim files, see validation
            results, and review issues without guessing.
          </p>
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          {VALUE_THEMES.map((theme, index) => (
            <article key={theme.title} className="relative pl-5">
              <span
                className="absolute top-1 left-0 h-full w-px bg-border"
                aria-hidden
              />
              <span
                className="absolute top-1.5 left-[-3px] size-1.5 rounded-full bg-primary"
                aria-hidden
              />
              <p className="font-mono text-xs text-muted-foreground">
                {String(index + 1).padStart(2, '0')}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-foreground">
                {theme.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {theme.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
