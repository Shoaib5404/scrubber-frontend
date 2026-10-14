'use client';

import { useState } from 'react';
import { AppShell } from '@/modules/batches/components/app-shell';
import { RequireAuth } from '@/modules/auth';
import { MyInquiriesPanel } from '@/modules/support/components/my-inquiries-panel';
import { PortalInquiryForm } from '@/modules/support/components/portal-inquiry-form';

export default function PortalSupportPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <RequireAuth>
      <AppShell
        title="Contact support"
        description="Review your inquiries or submit a new one."
        basePath="/portal"
      >
        <div className="grid gap-8 lg:grid-cols-5 lg:gap-6 xl:gap-8">
          <div className="order-1 min-w-0 lg:col-span-3">
            <MyInquiriesPanel refreshKey={refreshKey} />
          </div>
          <div className="order-2 min-w-0 lg:col-span-2">
            <div className="rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5 lg:sticky lg:top-20">
              <PortalInquiryForm
                compact
                onSubmitted={() => setRefreshKey((k) => k + 1)}
              />
            </div>
          </div>
        </div>
      </AppShell>
    </RequireAuth>
  );
}
