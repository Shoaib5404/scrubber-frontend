import { ShieldCheckIcon, UsersIcon, ZapIcon } from 'lucide-react';
import { BrandLogo } from '@/components/brand';
import { BRAND_NAME } from '@/lib/brand';

const BENEFITS = [
  {
    icon: ShieldCheckIcon,
    title: 'Intelligent validations',
    description: 'Automated 837 checks to ensure compliance before submission.',
  },
  {
    icon: ZapIcon,
    title: 'Instant feedback',
    description: 'Real-time error flagging reduces rejection rates significantly.',
  },
  {
    icon: UsersIcon,
    title: 'Multi-tenant portal',
    description: 'Tailored workflows for both staff and customer organizations.',
  },
] as const;

export function AuthSplitShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <aside className="relative flex w-full flex-col justify-between bg-gradient-to-br from-primary via-primary to-[#2dd4bf] p-8 text-primary-foreground lg:w-[45%] lg:p-12 xl:p-16">
        <div className="flex flex-col gap-8">
          <BrandLogo
            variant="logo"
            priority
            className="h-10 w-auto self-start lg:h-12"
          />

          <div className="mt-8 space-y-6 lg:mt-20">
            <h1 className="max-w-md text-3xl font-semibold tracking-tight text-white lg:text-4xl lg:leading-[1.1]">
              EDI claim scrubbing with absolute confidence.
            </h1>

            <ul className="space-y-4">
              {BENEFITS.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex items-start gap-3 text-primary-foreground/90">
                  <Icon className="mt-0.5 size-5 shrink-0 text-white" aria-hidden />
                  <div>
                    <p className="font-medium text-white">{title}</p>
                    <p className="text-sm text-primary-foreground/85">{description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-12 text-xs font-medium text-white/60 lg:mt-0">
          © {year} {BRAND_NAME}. All rights reserved.
        </p>
      </aside>

      <main className="flex flex-1 items-center justify-center p-8 lg:p-12 xl:p-24">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}

type AuthPanelProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthPanel({ title, description, children, footer }: AuthPanelProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
      {footer ? <div className="pt-1 text-center">{footer}</div> : null}
    </div>
  );
}
