import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthPanel, LoginForm } from '@/modules/auth';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Sign in',
};

export default function LoginPage() {
  return (
    <AuthPanel
      title="Sign in"
      description="Use your Neo Scrubber account email and password."
      footer={
        <p className="text-xs text-muted-foreground">
          Need assistance? Contact your organization administrator.
        </p>
      }
    >
      <Suspense
        fallback={
          <div className="flex flex-col gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthPanel>
  );
}
