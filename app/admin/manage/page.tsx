'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { PageHeader, RowSkeleton } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge, PriorityBadge } from '@/components/status-badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { STATUS_META, type Complaint, type ComplaintStatus, type Profile } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { Search, Eye, Inbox, Siren } from 'lucide-react';

export default function ManageComplaintsPage() {
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<(Complaint & { user?: Profile; assignee?: Profile | null })[]>([]);
  const [tab, setTab] = useState<ComplaintStatus>('under_review');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('complaints')
        .select('*, user:user_id(full_name, email), assignee:assigned_to(full_name)')
        .order('created_at', { ascending: false });
      setComplaints((data ?? []) as (Complaint & { user?: Profile; assignee?: Profile | null })[]);
      setLoading(false);
    })();
  }, []);

  const tabs: { key: ComplaintStatus; label: string }[] = [
    { key: 'submitted', label: 'New' },
    { key: 'under_review', label: 'Under review' },
    { key: 'in_progress', label: 'In progress' },
    { key: 'reopened', label: 'Reopened' },
  ];

  const rows = useMemo(() => {
    let r = complaints.filter((c) => c.status === tab);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.reference_number.toLowerCase().includes(q) ||
          (c.user?.full_name ?? '').toLowerCase().includes(q),
      );
    }
    return r;
  }, [complaints, tab, search]);

  return (
    <div>
      <PageHeader
        title="Manage complaints"
        description="Triage complaints that need attention by their current status."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => {
          const count = complaints.filter((c) => c.status === t.key).length;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={
                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ' +
                (active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted')
              }
            >
              {t.label}
              <span className={'rounded-full px-1.5 text-xs ' + (active ? 'bg-white/20' : 'bg-muted')}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <Card className="mb-4 p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search reference, title, or user…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="p-4"><RowSkeleton rows={6} /></div>
        ) : rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={tab === 'submitted' ? Inbox : Siren}
              title={`Nothing in "${STATUS_META[tab].label}"`}
              description="No complaints currently need action in this state."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Submitted by</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.reference_number}</TableCell>
                    <TableCell className="max-w-[200px] truncate font-medium">{c.title}</TableCell>
                    <TableCell className="text-sm">{c.user?.full_name ?? '—'}</TableCell>
                    <TableCell className="text-sm">{c.assignee?.full_name ?? '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(c.created_at)}</TableCell>
                    <TableCell><PriorityBadge priority={c.priority} /></TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/complaints/${c.id}`}>
                          <Eye className="mr-1.5 h-3.5 w-3.5" /> Manage
                        </Link>
                      </Button>
                    </TableCell>
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
