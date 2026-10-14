import {
  BoxesIcon,
  FileCheck2Icon,
  FolderOpenIcon,
  KeyRoundIcon,
  ShieldCheckIcon,
  UsersIcon,
} from 'lucide-react';
import { FEATURES } from '../content';

const ICONS = {
  edi: FileCheck2Icon,
  validation: ShieldCheckIcon,
  batches: BoxesIcon,
  claims: FolderOpenIcon,
  roles: UsersIcon,
  api: KeyRoundIcon,
} as const;

export function FeatureSection() {
  return (
    <section
      id="features"
      className="scroll-mt-20 py-16 sm:py-20"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2
            id="features-heading"
            className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            Features that match the portal
          </h2>
          <p className="mt-3 text-muted-foreground">
            Every highlight below maps to capabilities already available in
            Neo Scrubber—not roadmap fiction.
          </p>
        </div>

        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = ICONS[feature.id as keyof typeof ICONS];
            return (
              <li
                key={feature.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-xs"
              >
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.body}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
