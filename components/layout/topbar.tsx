'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';
import { useUnreadCount } from '@/hooks/use-unread-count';
import { cn } from '@/lib/utils';

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/submit': 'Submit Complaint',
  '/dashboard/complaints': 'My Complaints',
  '/dashboard/track': 'Track Complaint',
  '/dashboard/notifications': 'Notifications',
  '/dashboard/profile': 'Profile',
  '/admin': 'Dashboard',
  '/admin/complaints': 'All Complaints',
  '/admin/manage': 'Manage Complaints',
  '/admin/assign': 'Assign Complaints',
  '/admin/categories': 'Categories',
  '/admin/users': 'User Management',
  '/admin/reports': 'Reports & Analytics',
  '/admin/notifications': 'Notifications',
};

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const { unread } = useUnreadCount();
  const [bellHover, setBellHover] = useState(false);

  const title = titles[pathname] ?? 'OCMS';
  const notifHref =
    profile?.role === 'admin' ? '/admin/notifications' : '/dashboard/notifications';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-white/80 px-4 backdrop-blur-md sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu}>
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      </div>

      <Link
        href={notifHref}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        onMouseEnter={() => setBellHover(true)}
        onMouseLeave={() => setBellHover(false)}
        title="Notifications"
      >
        <Bell className={cn('h-5 w-5 transition-transform', bellHover && 'rotate-6')} />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 grid min-h-[18px] min-w-[18px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Link>

      <Link
        href={profile?.role === 'admin' ? '/admin/users' : '/dashboard/profile'}
        className="flex items-center gap-2 rounded-full border border-border bg-card pl-1 pr-3 py-1 transition-colors hover:bg-muted"
      >
        <div className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {profile?.full_name?.charAt(0).toUpperCase() ?? 'U'}
        </div>
        <span className="hidden text-sm font-medium text-foreground sm:inline">
          {profile?.full_name?.split(' ')[0] ?? 'User'}
        </span>
      </Link>
    </header>
  );
}
