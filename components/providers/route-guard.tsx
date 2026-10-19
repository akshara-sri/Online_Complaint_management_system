'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Loader2 } from 'lucide-react';
import type { UserRole } from '@/lib/types';

export function RouteGuard({
  role,
  children,
}: {
  role: UserRole;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!profile) {
      // profile not yet loaded; wait
      return;
    }
    if (profile.role !== role) {
      router.replace(profile.role === 'admin' ? '/admin' : '/dashboard');
      return;
    }
    setChecked(true);
  }, [loading, user, profile, role, router]);

  if (!checked) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-sm">Loading your workspace…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
