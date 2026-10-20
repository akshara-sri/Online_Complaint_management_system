'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Inbox,
  Clock,
  Loader,
  CheckCircle2,
  XCircle,
  Siren,
  ArrowRight,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/auth-provider';
import { StatCard } from '@/components/shared/stat-card';
import { PageHeader, CardSkeleton, RowSkeleton } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge, PriorityBadge } from '@/components/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { STATUS_META, type Complaint, type ComplaintStatus } from '@/lib/types';
import { formatRelative } from '@/lib/format';

interface AdminStats {
  total: number;
  new: number;
  pending: number;
  inProgress: number;
  resolved: number;
  rejected: number;
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({ total: 0, new: 0, pending: 0, inProgress: 0, resolved: 0, rejected: 0 });
  const [recent, setRecent] = useState<Complaint[]>([]);
  const [highPriority, setHighPriority] = useState<Complaint[]>([]);
  const [dist, setDist] = useState<{ name: string; value: number; color: string }[]>([]);
  const [byCat, setByCat] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });
      const all = (data ?? []) as Complaint[];
      setStats({
        total: all.length,
        new: all.filter((c) => c.status === 'submitted').length,
        pending: all.filter((c) => c.status === 'under_review' || c.status === 'reopened').length,
        inProgress: all.filter((c) => c.status === 'in_progress').length,
        resolved: all.filter((c) => c.status === 'resolved').length,
        rejected: all.filter((c) => c.status === 'rejected').length,
      });
      setRecent(all.slice(0, 6));
      setHighPriority(all.filter((c) => c.priority === 'high' || c.priority === 'critical').slice(0, 5));

      const d: { name: string; value: number; color: string }[] = [];
      (Object.keys(STATUS_META) as ComplaintStatus[]).forEach((s) => {
        const count = all.filter((c) => c.status === s).length;
        if (count > 0) d.push({ name: STATUS_META[s].label, value: count, color: STATUS_META[s].color });
      });
      setDist(d);

      const catMap = new Map<string, number>();
      all.forEach((c) => catMap.set(c.category, (catMap.get(c.category) ?? 0) + 1));
      setByCat(Array.from(catMap.entries()).map(([name, count]) => ({ name, count })));
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <PageHeader
        title={`Admin overview`}
        description={`Welcome back, ${profile?.full_name?.split(' ')[0] ?? 'Admin'}. Here's the current state of all complaints.`}
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/reports">View reports <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {loading ? (
          <>
            <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Total" value={stats.total} icon={LayoutDashboard} tone="primary" />
            <StatCard label="New" value={stats.new} icon={Inbox} tone="info" />
            <StatCard label="Pending" value={stats.pending} icon={Clock} tone="warning" />
            <StatCard label="In progress" value={stats.inProgress} icon={Loader} tone="warning" />
            <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} tone="success" />
            <StatCard label="Rejected" value={stats.rejected} icon={XCircle} tone="destructive" />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Recent submissions</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-primary">
              <Link href="/admin/complaints">View all <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <RowSkeleton rows={5} />
            ) : recent.length === 0 ? (
              <EmptyState icon={Inbox} title="No complaints yet" description="New submissions will appear here." />
            ) : (
              <div className="divide-y divide-border">
                {recent.map((c) => (
                  <Link
                    key={c.id}
                    href={`/admin/complaints/${c.id}`}
                    className="flex items-center gap-4 py-3 -mx-2 px-2 rounded-md hover:bg-muted/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{c.title}</p>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">{c.reference_number}</p>
                    </div>
                    <PriorityBadge priority={c.priority} />
                    <StatusBadge status={c.status} />
                    <span className="hidden text-xs text-muted-foreground sm:inline">{formatRelative(c.created_at)}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-56 animate-pulse rounded-lg bg-muted/40" />
            ) : dist.length === 0 ? (
              <EmptyState icon={LayoutDashboard} title="No data" />
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dist} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                      {dist.map((e) => (
                        <Cell key={e.name} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Complaints by category</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 animate-pulse rounded-lg bg-muted/40" />
            ) : byCat.length === 0 ? (
              <EmptyState icon={LayoutDashboard} title="No data" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCat} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={60} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">High priority</CardTitle>
            <Siren className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <RowSkeleton rows={3} />
            ) : highPriority.length === 0 ? (
              <EmptyState icon={Siren} title="None" description="No high or critical priority complaints." />
            ) : (
              <div className="divide-y divide-border">
                {highPriority.map((c) => (
                  <Link
                    key={c.id}
                    href={`/admin/complaints/${c.id}`}
                    className="flex items-center justify-between gap-2 py-3 -mx-2 px-2 rounded-md hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{c.title}</p>
                      <p className="font-mono text-xs text-muted-foreground">{c.reference_number}</p>
                    </div>
                    <PriorityBadge priority={c.priority} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
