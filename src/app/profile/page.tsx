'use client';

import { ProfilePage, RequireAuth } from '@/modules/auth';

export default function ProfileRoute() {
  return (
    <RequireAuth>
      <ProfilePage />
    </RequireAuth>
  );
}
