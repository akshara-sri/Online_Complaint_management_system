'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { useAuth } from '@/components/providers/auth-provider';
import {
  LayoutDashboard,
  FilePlus2,
  ListChecks,
  Search,
  Bell,
  User as UserIcon,
  LogOut,
  Users,
  FolderTree,
  BarChart3,
  Siren,
  ClipboardList,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const userNav: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/submit', label: 'Submit Complaint', icon: FilePlus2 },
  { href: '/dashboard/complaints', label: 'My Complaints', icon: ListChecks },
  { href: '/dashboard/track', label: 'Track Complaint', icon: Search },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/profile', label: 'Profile', icon: UserIcon },
];

const adminNav: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/complaints', label: 'All Complaints', icon: ClipboardList },
  { href: '/admin/manage', label: 'Manage Complaints', icon: Siren },
  { href: '/admin/assign', label: 'Assign Complaints', icon: FolderTree },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/users', label: 'User Management', icon: Users },
  { href: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3 },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
];

export function Sidebar({
  role,
  open,
  onClose,
}: {
  role: 'user' | 'admin';
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const nav = role === 'admin' ? adminNav : userNav;

  async function handleLogout() {
    await signOut();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border bg-white transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <Link href="/" className="flex items-center">
            <Logo />
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
          <div className="mb-2 flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {role === 'admin' ? (
              <>
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Administrator
              </>
            ) : (
              <>
                <UserIcon className="h-3.5 w-3.5 text-primary" />
                User Panel
              </>
            )}
          </div>
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/dashboard' &&
                item.href !== '/admin' &&
                pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <item.icon
                  className={cn(
                    'h-4.5 w-4.5 shrink-0',
                    active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {profile?.full_name?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">
                {profile?.full_name ?? 'User'}
              </div>
              <div className="truncate text-xs text-muted-foreground">{profile?.email}</div>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
}
