'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/auth-provider';
import { PageHeader, RowSkeleton } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge, PriorityBadge } from '@/components/status-badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/format';
import { STATUS_META, STATUS_VALUES, type Complaint, type ComplaintStatus } from '@/lib/types';
import { Search, Eye, ArrowUpDown, Inbox, FilePlus2 } from 'lucide-react';

type SortKey = 'created_at' | 'title' | 'status' | 'priority';

export default function MyComplaintsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (!profile) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      setComplaints((data ?? []) as Complaint[]);
      setLoading(false);
    })();
  }, [profile]);

  const categories = useMemo(
    () => Array.from(new Set(complaints.map((c) => c.category))),
    [complaints],
  );

  const filtered = useMemo(() => {
    let rows = complaints;
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.reference_number.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== 'all') rows = rows.filter((c) => c.status === statusFilter);
    if (categoryFilter !== 'all') rows = rows.filter((c) => c.category === categoryFilter);
    const dir = sortDir === 'asc' ? 1 : -1;
    const priorityRank: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'created_at') cmp = a.created_at.localeCompare(b.created_at);
      else if (sortKey === 'title') cmp = a.title.localeCompare(b.title);
      else if (sortKey === 'status') cmp = a.status.localeCompare(b.status);
      else if (sortKey === 'priority') cmp = priorityRank[a.priority] - priorityRank[b.priority];
      return cmp * dir;
    });
    return rows;
  }, [complaints, search, statusFilter, categoryFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  return (
    <div>
      <PageHeader
        title="My complaints"
        description="Search, filter, and sort all complaints you have submitted."
        actions={
          <Button asChild size="sm">
            <Link href="/dashboard/submit">
              <FilePlus2 className="mr-2 h-4 w-4" /> New
            </Link>
          </Button>
        }
      />

      <Card className="mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search title, reference, or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_VALUES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_META[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="p-4">
            <RowSkeleton rows={6} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Inbox}
              title="No complaints found"
              description={complaints.length === 0 ? 'Submit your first complaint to see it here.' : 'Try adjusting your filters or search.'}
              action={
                complaints.length === 0 ? (
                  <Button asChild size="sm">
                    <Link href="/dashboard/submit">Submit a complaint</Link>
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button className="inline-flex items-center gap-1 font-medium" onClick={() => toggleSort('title')}>
                      Title <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>
                    <button className="inline-flex items-center gap-1 font-medium" onClick={() => toggleSort('created_at')}>
                      Date <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button className="inline-flex items-center gap-1 font-medium" onClick={() => toggleSort('priority')}>
                      Priority <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button className="inline-flex items-center gap-1 font-medium" onClick={() => toggleSort('status')}>
                      Status <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="max-w-[220px] truncate font-medium">{c.title}</TableCell>
                    <TableCell className="font-mono text-xs">{c.reference_number}</TableCell>
                    <TableCell className="text-sm">{c.category}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(c.created_at)}</TableCell>
                    <TableCell><PriorityBadge priority={c.priority} /></TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/complaints/${c.id}`}>
                          <Eye className="mr-1.5 h-3.5 w-3.5" /> View
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
