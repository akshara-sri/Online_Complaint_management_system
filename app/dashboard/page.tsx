'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Clock,
  Loader,
  CheckCircle2,
  FileText,
  ArrowRight,
  Inbox,
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

interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
}

export default function UserDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [recent, setRecent] = useState<Complaint[]>([]);
  const [distribution, setDistribution] = useState<{ name: string; value: number; color: string }[]>([]);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      setLoading(true);
      const { data: complaints } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      const all = (complaints ?? []) as Complaint[];
      const pending = all.filter(
        (c) => c.status === 'submitted' || c.status === 'under_review' || c.status === 'reopened',
      ).length;
      const inProgress = all.filter((c) => c.status === 'in_progress').length;
      const resolved = all.filter((c) => c.status === 'resolved').length;

      setStats({ total: all.length, pending, inProgress, resolved });
      setRecent(all.slice(0, 5));

      const dist: { name: string; value: number; color: string }[] = [];
      (Object.keys(STATUS_META) as ComplaintStatus[]).forEach((s) => {
        const count = all.filter((c) => c.status === s).length;
        if (count > 0) dist.push({ name: STATUS_META[s].label, value: count, color: STATUS_META[s].color });
      });
      setDistribution(dist);
      setLoading(false);
    })();
  }, [profile]);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${profile?.full_name?.split(' ')[0] ?? 'there'}`}
        description="Here's an overview of your complaints and their current status."
        actions={
          <Button asChild size="sm" className="gap-2">
            <Link href="/dashboard/submit">
              <FileText className="h-4 w-4" /> New complaint
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Total complaints" value={stats.total} icon={LayoutDashboard} tone="primary" />
            <StatCard label="Pending" value={stats.pending} icon={Clock} tone="info" />
            <StatCard label="In progress" value={stats.inProgress} icon={Loader} tone="warning" />
            <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} tone="success" />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Recent complaints</CardTitle>
            <Button asChild variant="ghost" size="sm" className="gap-1 text-primary">
              <Link href="/dashboard/complaints">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <RowSkeleton rows={4} />
            ) : recent.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No complaints yet"
                description="Submit your first complaint to start tracking its progress."
                action={
                  <Button asChild size="sm">
                    <Link href="/dashboard/submit">Submit a complaint</Link>
                  </Button>
                }
              />
            ) : (
              <div className="divide-y divide-border">
                {recent.map((c) => (
                  <Link
                    key={c.id}
                    href={`/dashboard/complaints/${c.id}`}
                    className="flex items-center gap-4 py-3 transition-colors hover:bg-muted/40 -mx-2 px-2 rounded-md"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-foreground">{c.title}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono">{c.reference_number}</span>
                        <span>•</span>
                        <span>{c.category}</span>
                        <span>•</span>
                        <span>{formatRelative(c.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={c.priority} />
                      <StatusBadge status={c.status} />
                    </div>
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
              <div className="h-64 animate-pulse rounded-lg bg-muted/40" />
            ) : distribution.length === 0 ? (
              <EmptyState icon={LayoutDashboard} title="No data" description="Submit a complaint to see charts." />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribution}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {distribution.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {!loading && recent.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Complaints by category</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryChart userId={profile?.id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CategoryChart({ userId }: { userId?: string }) {
  const [data, setData] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data: rows } = await supabase
        .from('complaints')
        .select('category')
        .eq('user_id', userId);
      const map = new Map<string, number>();
      (rows ?? []).forEach((r: { category: string }) => {
        map.set(r.category, (map.get(r.category) ?? 0) + 1);
      });
      setData(Array.from(map.entries()).map(([name, count]) => ({ name, count })));
      setLoading(false);
    })();
  }, [userId]);

  if (loading) return <div className="h-64 animate-pulse rounded-lg bg-muted/40" />;
  if (data.length === 0)
    return <EmptyState icon={LayoutDashboard} title="No data" description="No complaints to chart yet." />;

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-15} textAnchor="end" height={60} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
