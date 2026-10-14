import { TRUST_ITEMS } from '../content';

export function TrustStrip() {
  return (
    <section
      className="border-y border-border bg-card"
      aria-label="Product capabilities"
    >
      <ul className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-5 text-sm text-muted-foreground sm:px-6 lg:px-8">
        {TRUST_ITEMS.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <span
              className="size-1.5 shrink-0 rounded-full bg-primary"
              aria-hidden
            />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
