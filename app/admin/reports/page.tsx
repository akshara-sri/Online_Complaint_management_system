'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PageHeader, CardSkeleton } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { STATUS_META, type Complaint, type ComplaintStatus, type ComplaintPriority } from '@/lib/types';
import { Download, BarChart3, Loader2 } from 'lucide-react';

const PRIORITIES: ComplaintPriority[] = ['low', 'medium', 'high', 'critical'];
const PRIORITY_COLORS: Record<ComplaintPriority, string> = {
  low: '#64748b',
  medium: '#0ea5e9',
  high: '#f97316',
  critical: '#dc2626',
};

function escapeCsv(v: unknown): string {
  const s = v == null ? '' : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [all, setAll] = useState<Complaint[]>([]);
  const [range, setRange] = useState('30');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('complaints').select('*').order('created_at', { ascending: true });
      setAll((data ?? []) as Complaint[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    if (range === 'all') return all;
    const days = parseInt(range, 10);
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return all.filter((c) => new Date(c.created_at).getTime() >= cutoff);
  }, [all, range]);

  const byStatus = useMemo(() => {
    const arr: { name: string; value: number; color: string }[] = [];
    (Object.keys(STATUS_META) as ComplaintStatus[]).forEach((s) => {
      const count = filtered.filter((c) => c.status === s).length;
      if (count > 0) arr.push({ name: STATUS_META[s].label, value: count, color: STATUS_META[s].color });
    });
    return arr;
  }, [filtered]);

  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((c) => m.set(c.category, (m.get(c.category) ?? 0) + 1));
    return Array.from(m.entries()).map(([name, count]) => ({ name, count }));
  }, [filtered]);

  const byPriority = useMemo(() => {
    const m = new Map<ComplaintPriority, number>();
    PRIORITIES.forEach((p) => m.set(p, 0));
    filtered.forEach((c) => m.set(c.priority, (m.get(c.priority) ?? 0) + 1));
    return PRIORITIES.map((p) => ({ name: p[0].toUpperCase() + p.slice(1), count: m.get(p) ?? 0, color: PRIORITY_COLORS[p] }));
  }, [filtered]);

  const monthlyTrend = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((c) => {
      const d = new Date(c.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      m.set(key, (m.get(key) ?? 0) + 1);
    });
    return Array.from(m.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [filtered]);

  const resolvedCount = filtered.filter((c) => c.status === 'resolved').length;
  const unresolvedCount = filtered.length - resolvedCount;
  const avgResolutionMs = useMemo(() => {
    const r = filtered.filter((c) => c.status === 'resolved' && c.resolved_at);
    if (r.length === 0) return null;
    const total = r.reduce((acc, c) => acc + (new Date(c.resolved_at!).getTime() - new Date(c.created_at).getTime()), 0);
    return total / r.length;
  }, [filtered]);

  function exportCsv() {
    const headers = ['Reference', 'Title', 'Category', 'Priority', 'Status', 'Department', 'Created', 'Resolved', 'Resolution'];
    const rows = filtered.map((c) => [
      c.reference_number,
      c.title,
      c.category,
      c.priority,
      c.status,
      c.department ?? '',
      c.created_at,
      c.resolved_at ?? '',
      c.resolution_details ?? '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocms-complaints-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Reports & analytics"
        description="Aggregated statistics across all complaints with CSV export."
        actions={
          <div className="flex items-center gap-2">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportCsv} disabled={loading || filtered.length === 0} size="sm">
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5">
              <p className="text-sm text-muted-foreground">Total (in range)</p>
              <p className="mt-2 text-3xl font-bold">{filtered.length}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-muted-foreground">Resolved</p>
              <p className="mt-2 text-3xl font-bold text-emerald-600">{resolvedCount}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-muted-foreground">Unresolved</p>
              <p className="mt-2 text-3xl font-bold text-amber-600">{unresolvedCount}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-muted-foreground">Avg resolution time</p>
              <p className="mt-2 text-3xl font-bold">
                {avgResolutionMs == null
                  ? '—'
                  : avgResolutionMs < 3600000
                    ? `${Math.round(avgResolutionMs / 60000)}m`
                    : avgResolutionMs < 86400000
                      ? `${(avgResolutionMs / 3600000).toFixed(1)}h`
                      : `${(avgResolutionMs / 86400000).toFixed(1)}d`}
              </p>
            </Card>
          </div>

          {filtered.length === 0 ? (
            <Card className="mt-6">
              <CardContent className="p-6">
                <EmptyState icon={BarChart3} title="No data in range" description="Try a wider date range." />
              </CardContent>
            </Card>
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <ChartCard title="Complaints by status">
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {byStatus.map((e) => <Cell key={e.name} fill={e.color} />)}
                  </Pie>
                  <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ChartCard>

              <ChartCard title="Complaints by priority">
                <BarChart data={byPriority} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {byPriority.map((e) => <Cell key={e.name} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ChartCard>

              <ChartCard title="Complaints by category">
                <BarChart data={byCategory} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartCard>

              <ChartCard title="Monthly trend">
                <LineChart data={monthlyTrend} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ChartCard>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
