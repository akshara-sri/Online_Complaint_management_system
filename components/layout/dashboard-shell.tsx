'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { RouteGuard } from '@/components/providers/route-guard';
import type { UserRole } from '@/lib/types';

export function DashboardShell({
  role,
  children,
}: {
  role: UserRole;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <RouteGuard role={role}>
      <div className="min-h-screen bg-background">
        <Sidebar role={role} open={open} onClose={() => setOpen(false)} />
        <div className="lg:pl-72">
          <Topbar onMenu={() => setOpen(true)} />
          <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
            <div className="animate-fade-in">{children}</div>
          </main>
        </div>
      </div>
    </RouteGuard>
  );
}
