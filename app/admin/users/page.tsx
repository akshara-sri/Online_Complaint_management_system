'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PageHeader, RowSkeleton } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Profile } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { Search, Users, ShieldCheck, User as UserIcon, Info } from 'lucide-react';
import { useState as useReactState } from 'react';

export default function UserManagementPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useReactState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      const list = (data ?? []) as Profile[];
      setUsers(list);
      // complaint counts per user
      const { data: rows } = await supabase.from('complaints').select('user_id');
      const map: Record<string, number> = {};
      (rows ?? []).forEach((r: { user_id: string }) => {
        map[r.user_id] = (map[r.user_id] ?? 0) + 1;
      });
      setCounts(map);
      setLoading(false);
    })();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const adminCount = users.filter((u) => u.role === 'admin').length;

  return (
    <div>
      <PageHeader
        title="User management"
        description="View all registered users and their complaint activity."
      />

      <div className="mb-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          For security, role changes (promoting a user to administrator) are performed via SQL with the
          service role key — see the README &quot;Administrator provisioning&quot; section. The <code>role</code> column
          is not editable from the client by design.
        </div>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-3 p-4">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total users</p>
            <p className="text-xl font-bold">{users.length}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-100 text-emerald-600">
            <UserIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Standard users</p>
            <p className="text-xl font-bold">{users.length - adminCount}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-violet-100 text-violet-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Administrators</p>
            <p className="text-xl font-bold">{adminCount}</p>
          </div>
        </Card>
      </div>

      <Card className="mb-4 p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="p-4"><RowSkeleton rows={6} /></div>
        ) : filtered.length === 0 ? (
          <div className="p-6"><EmptyState icon={Users} title="No users found" /></div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Complaints</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name}</TableCell>
                    <TableCell className="text-sm">{u.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.phone ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                        {u.role === 'admin' ? 'Admin' : 'User'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{counts[u.id] ?? 0}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(u.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
