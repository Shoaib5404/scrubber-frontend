'use client';

import Link from 'next/link';
import { useAuthStore } from '@/modules/auth';

type AppShellProps = {
  title: string;
  basePath: '/portal' | '/dashboard';
  children: React.ReactNode;
};

export function AppShell({ title, basePath, children }: AppShellProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href={basePath} className="text-lg font-semibold tracking-tight text-slate-900">
              Neo Scrubber
            </Link>
            <nav className="flex gap-3 text-sm">
              <Link
                href={basePath}
                className="rounded-md px-2 py-1 text-slate-700 hover:bg-slate-100"
              >
                Batches
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span className="hidden sm:inline">{user?.email}</span>
            <button
              type="button"
              onClick={() => void logout().then(() => {
                window.location.href = '/login';
              })}
              className="rounded-md border border-slate-300 px-2.5 py-1.5 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}
