'use client';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Root layout failure fallback. Must define its own html/body.
 * Intentionally avoids rendering raw exception details.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 px-6 font-sans text-foreground">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          The application hit an unexpected error. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="w-fit rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          Try again
        </button>
        <p className="sr-only">{error.digest ? `Error reference ${error.digest}` : null}</p>
      </body>
    </html>
  );
}
