'use client';

import Link from 'next/link';
import { BrandLogo } from '@/components/brand';
import { useDocumentTitle } from '@/hooks/use-document-title';

export default function Home() {
  useDocumentTitle('Home');

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6">
      <BrandLogo variant="logo" priority className="h-14 w-auto" />
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Neo Scrubber
      </h1>
      <p className="text-muted-foreground">
        EDI claim scrubbing for healthcare operations — upload, validate, and review
        claims with your team.
      </p>
      <ul className="flex list-none flex-col gap-2 pl-0 text-foreground/90">
        <li>
          <Link
            className="font-medium text-primary underline-offset-2 hover:underline"
            href="/login"
          >
            Sign in
          </Link>
        </li>
      </ul>
    </main>
  );
}
