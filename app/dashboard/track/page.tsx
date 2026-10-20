'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/auth-provider';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge, PriorityBadge } from '@/components/status-badge';
import { Search, Loader2, FileText, ArrowRight } from 'lucide-react';
import type { Complaint } from '@/lib/types';
import { formatDateTime } from '@/lib/format';

export default function TrackComplaintPage() {
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<Complaint | null>(null);
  const [searched, setSearched] = useState(false);
  const [mine, setMine] = useState<Complaint[]>([]);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from('complaints')
        .select('id, reference_number, title, status, priority, category, created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(6);
      setMine((data ?? []) as Complaint[]);
    })();
  }, [profile]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearched(true);
    const { data } = await supabase
      .from('complaints')
      .select('*')
      .eq('reference_number', query.trim().toUpperCase())
      .maybeSingle();
    setResult((data as Complaint) ?? null);
    setSearching(false);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Track a complaint"
        description="Enter a complaint reference number to view its current status."
      />

      <Card className="mb-6">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="e.g. OCMS-2026-000123"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 font-mono"
              />
            </div>
            <Button type="submit" disabled={searching}>
              {searching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Track
            </Button>
          </form>
          {searched && !searching && (
            <div className="mt-5">
              {result ? (
                <Link
                  href={`/dashboard/complaints/${result.id}`}
                  className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 p-4 transition-colors hover:bg-muted"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs text-muted-foreground">{result.reference_number}</p>
                    <p className="mt-0.5 truncate font-medium text-foreground">{result.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {result.category} • {formatDateTime(result.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={result.priority} />
                    <StatusBadge status={result.status} />
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No complaint found"
                  description="Double-check the reference number and try again. You can only track complaints linked to your account."
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {mine.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Your recent complaints</h3>
            <div className="divide-y divide-border">
              {mine.map((c) => (
                <Link
                  key={c.id}
                  href={`/dashboard/complaints/${c.id}`}
                  className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-muted/30 -mx-2 px-2 rounded-md"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{c.title}</p>
                    <p className="font-mono text-xs text-muted-foreground">{c.reference_number}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
