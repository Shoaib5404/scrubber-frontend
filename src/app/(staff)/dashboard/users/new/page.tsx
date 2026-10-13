'use client';

import { AppShell } from '@/modules/batches/components/app-shell';
import { RequireAuth } from '@/modules/auth';
import { UserForm } from '@/modules/users-admin';

export default function CreateUserPage() {
  return (
    <RequireAuth staffOnly>
      <AppShell title="Create user" basePath="/dashboard">
        <UserForm mode="create" />
      </AppShell>
    </RequireAuth>
  );
}
