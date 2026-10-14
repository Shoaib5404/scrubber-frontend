import Image from 'next/image';
import { SERVICES } from '../content';

export function ProductShowcase() {
  return (
    <section
      id="services"
      className="scroll-mt-20 border-y border-border bg-card py-16 sm:py-20"
      aria-labelledby="showcase-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2
            id="showcase-heading"
            className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            Services for billing operations
          </h2>
          <p className="mt-3 text-muted-foreground">
            One portal for scrubbing professional claims, coordinating your
            team, and keeping operational visibility across batches.
          </p>
        </div>

        <div className="mt-12 space-y-16">
          {SERVICES.map((service, index) => {
            const reverse = index % 2 === 1;
            return (
              <article
                key={service.title}
                className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-12 ${
                  reverse ? 'lg:[&>*:first-child]:order-2' : ''
                }`}
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-muted">
                  <Image
                    src={service.image}
                    alt={service.imageAlt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 560px"
                    className="object-cover"
                    priority={index === 0}
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                    {service.title}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                    {service.body}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
