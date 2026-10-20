'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/auth-provider';
import { useUnreadCount } from '@/hooks/use-unread-count';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import type { Notification } from '@/lib/types';
import { formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const { user } = useAuth();
  const { refresh } = useUnreadCount();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Notification[]>([]);

  async function load() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setItems((data ?? []) as Notification[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [user]);

  async function markAllRead() {
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    await load();
    refresh();
  }

  async function markOne(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    refresh();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Notifications"
        description="Updates about your complaints appear here."
        actions={
          items.some((n) => !n.is_read) ? (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <CheckCheck className="mr-2 h-4 w-4" /> Mark all read
            </Button>
          ) : undefined
        }
      />
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
          </div>
        ) : items.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Bell}
              title="No notifications yet"
              description="You'll be notified here when your complaints are reviewed, assigned, or resolved."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((n) => (
              <li
                key={n.id}
                className={cn(
                  'flex items-start gap-3 px-4 py-3 transition-colors',
                  n.is_read ? 'bg-transparent' : 'bg-primary/5',
                )}
              >
                <div
                  className={cn(
                    'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                    n.is_read ? 'bg-transparent' : 'bg-primary',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{n.message}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatRelative(n.created_at)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {n.complaint_id && (
                    <Button asChild variant="ghost" size="sm" className="h-8">
                      <Link href={`/dashboard/complaints/${n.complaint_id}`}>View</Link>
                    </Button>
                  )}
                  {!n.is_read && (
                    <Button variant="ghost" size="sm" className="h-8" onClick={() => markOne(n.id)}>
                      Mark read
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
