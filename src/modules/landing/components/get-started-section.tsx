import { GET_STARTED_STEPS } from '../content';
import { Button } from '@/components/ui/button';

export function GetStartedSection() {
  return (
    <section
      id="get-started"
      className="scroll-mt-20 py-16 sm:py-20"
      aria-labelledby="get-started-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2
              id="get-started-heading"
              className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
            >
              Steps to start scrubbing
            </h2>
            <p className="mt-3 text-muted-foreground">
              Subscriptions are provisioned per organization. There is no
              self-serve signup—request a demo and we activate the portal for
              your team.
            </p>
          </div>
          <Button asChild>
            <a href="#demo">Request a demo</a>
          </Button>
        </div>

        <ol className="mt-10 space-y-0">
          {GET_STARTED_STEPS.map((step, index) => (
            <li
              key={step.step}
              className="grid gap-4 border-t border-border py-6 sm:grid-cols-[4rem_1fr] sm:gap-8"
            >
              <span className="font-mono text-2xl font-semibold text-primary">
                {step.step}
              </span>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
                {index === GET_STARTED_STEPS.length - 1 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Already provisioned?{' '}
                    <a
                      href="/login"
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Sign in
                    </a>
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
