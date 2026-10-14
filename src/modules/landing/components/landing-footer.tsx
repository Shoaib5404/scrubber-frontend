import Link from 'next/link';
import { BrandLogo } from '@/components/brand';
import { BRAND_NAME } from '@/lib/brand';
import { FOOTER_BLURB, LANDING_NAV } from '../content';

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-secondary text-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_1fr_1fr] lg:px-8">
        <div>
          <BrandLogo variant="logo" className="h-9 w-auto" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {FOOTER_BLURB}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground">Product</p>
          <ul className="mt-3 space-y-2">
            {LANDING_NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#get-started"
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                Get started
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground">Account</p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link
                href="/login"
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                Sign in
              </Link>
            </li>
            <li>
              <a
                href="#demo"
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                Request a demo
              </a>
            </li>
            <li>
              <Link
                href="/contact"
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                Contact us
              </Link>
            </li>
          </ul>
          <p className="mt-6 text-xs text-muted-foreground/80">
            Privacy Policy and Terms links will appear here when published.
          </p>
        </div>
      </div>

      <div className="border-t border-border/80">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground sm:px-6 lg:px-8">
          © {year} {BRAND_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
