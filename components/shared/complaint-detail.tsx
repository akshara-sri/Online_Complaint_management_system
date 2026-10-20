'use client';

import { useEffect, useState } from 'react';
import {
  supabase,
  STORAGE_BUCKET,
} from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StatusBadge, PriorityBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { useToast } from '@/hooks/use-toast';
import {
  STATUS_META,
  type Complaint,
  type ComplaintAttachment,
  type ComplaintHistory,
  type ComplaintStatus,
  type Profile,
} from '@/lib/types';
import { formatDateTime, formatRelative, formatBytes } from '@/lib/format';
import {
  Download,
  Paperclip,
  RotateCcw,
  Loader2,
  FileText,
  Clock,
  User as UserIcon,
} from 'lucide-react';
import Link from 'next/link';

interface Props {
  complaintId: string;
  isAdmin?: boolean;
  backHref?: string;
}

export function ComplaintDetail({ complaintId, isAdmin, backHref }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [assignee, setAssignee] = useState<Profile | null>(null);
  const [history, setHistory] = useState<(ComplaintHistory & { changer?: Profile | null })[]>([]);
  const [attachments, setAttachments] = useState<ComplaintAttachment[]>([]);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenOpen, setReopenOpen] = useState(false);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: c } = await supabase
        .from('complaints')
        .select('*')
        .eq('id', complaintId)
        .maybeSingle();
      if (!c) {
        setLoading(false);
        return;
      }
      setComplaint(c as Complaint);
      if ((c as Complaint).user_id) {
        const { data: u } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone')
          .eq('id', (c as Complaint).user_id)
          .maybeSingle();
        setUser(u as Profile | null);
      }
      if ((c as Complaint).assigned_to) {
        const { data: a } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', (c as Complaint).assigned_to)
          .maybeSingle();
        setAssignee(a as Profile | null);
      }
      const { data: hist } = await supabase
        .from('complaint_history')
        .select('*')
        .eq('complaint_id', complaintId)
        .order('created_at', { ascending: true });
      const histRows = (hist ?? []) as ComplaintHistory[];
      const changerIds = Array.from(new Set(histRows.map((h) => h.changed_by).filter(Boolean))) as string[];
      let changerMap: Record<string, Profile> = {};
      if (changerIds.length) {
        const { data: changers } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', changerIds);
        (changers ?? []).forEach((p) => {
          changerMap[(p as Profile).id] = p as Profile;
        });
      }
      setHistory(histRows.map((h) => ({ ...h, changer: h.changed_by ? changerMap[h.changed_by] ?? null : null })));
      const { data: atts } = await supabase
        .from('complaint_attachments')
        .select('*')
        .eq('complaint_id', complaintId);
      setAttachments((atts ?? []) as ComplaintAttachment[]);
      setLoading(false);
    })();
  }, [complaintId]);

  async function handleReopen() {
    if (!reopenReason.trim()) {
      toast({ title: 'Reason required', description: 'Please explain why you are reopening this complaint.', variant: 'destructive' });
      return;
    }
    setActing(true);
    const { data, error } = await supabase.rpc('update_complaint_status', {
      p_complaint_id: complaintId,
      p_new_status: 'reopened' as ComplaintStatus,
      p_remarks: reopenReason,
      p_reopen_reason: reopenReason,
    });
    setActing(false);
    if (error) {
      toast({ title: 'Reopen failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Complaint reopened', description: 'Administrators have been notified.' });
    setComplaint(data as Complaint);
    setReopenOpen(false);
    setReopenReason('');
    // refresh history
    const { data: hist } = await supabase
      .from('complaint_history')
      .select('*')
      .eq('complaint_id', complaintId)
      .order('created_at', { ascending: true });
    setHistory((hist ?? []) as ComplaintHistory[]);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading complaint…
      </div>
    );
  }

  if (!complaint) {
    return (
      <EmptyState
        icon={FileText}
        title="Complaint not found"
        description="You may not have access to this complaint, or it does not exist."
        action={
          backHref ? (
            <Button asChild size="sm">
              <Link href={backHref}>Go back</Link>
            </Button>
          ) : undefined
        }
      />
    );
  }

  const canReopen = !isAdmin && complaint.status === 'resolved';

  return (
    <div className="space-y-6">
      {backHref && (
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={backHref}>← Back</Link>
        </Button>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{complaint.reference_number}</span>
            <span>•</span>
            <span>{formatDateTime(complaint.created_at)}</span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{complaint.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
            <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {complaint.category}
            </span>
          </div>
        </div>
        {canReopen && !reopenOpen && (
          <Button variant="outline" onClick={() => setReopenOpen(true)}>
            <RotateCcw className="mr-2 h-4 w-4" /> Reopen
          </Button>
        )}
      </div>

      {reopenOpen && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader>
            <CardTitle className="text-base">Reopen this complaint</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="reopen">Reason for reopening *</Label>
              <Textarea
                id="reopen"
                rows={3}
                placeholder="Explain why the resolution is not satisfactory…"
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setReopenOpen(false)}>Cancel</Button>
              <Button onClick={handleReopen} disabled={acting}>
                {acting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm reopen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {complaint.description}
            </p>
            {complaint.resolution_details && (
              <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Resolution details
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                  {complaint.resolution_details}
                </p>
              </div>
            )}
            {complaint.reopen_reason && (
              <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                  Reopen reason
                </p>
                <p className="mt-1 text-sm text-foreground">{complaint.reopen_reason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Department" value={complaint.department ?? '—'} />
            <DetailRow
              label="Submitted by"
              value={user ? `${user.full_name}${user.email ? ` · ${user.email}` : ''}` : '—'}
            />
            <DetailRow
              label="Assigned to"
              value={assignee ? assignee.full_name : 'Unassigned'}
            />
            <DetailRow label="Created" value={formatDateTime(complaint.created_at)} />
            <DetailRow label="Updated" value={formatDateTime(complaint.updated_at)} />
            {complaint.resolved_at && (
              <DetailRow label="Resolved" value={formatDateTime(complaint.resolved_at)} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attachments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attachments</CardTitle>
        </CardHeader>
        <CardContent>
          {attachments.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No attachments.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {attachments.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{a.file_name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(a.file_size)}</p>
                  </div>
                  <a
                    href={supabase.storage.from(STORAGE_BUCKET).getPublicUrl(a.file_path).data.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tracking timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No history yet.</p>
          ) : (
            <ol className="relative space-y-6 border-l border-border pl-6">
              {history.map((h) => (
                <li key={h.id} className="relative">
                  <span
                    className="absolute -left-[27px] top-1 grid h-4 w-4 place-items-center rounded-full border-2 border-white"
                    style={{ backgroundColor: STATUS_META[h.new_status].color }}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {STATUS_META[h.new_status].label}
                    </span>
                    {h.previous_status && (
                      <span className="text-xs text-muted-foreground">
                        from {STATUS_META[h.previous_status].label}
                      </span>
                    )}
                  </div>
                  {h.remarks && (
                    <p className="mt-1 text-sm text-muted-foreground">{h.remarks}</p>
                  )}
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatDateTime(h.created_at)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <UserIcon className="h-3 w-3" /> {h.changer?.full_name ?? 'System'}
                    </span>
                    <span>{formatRelative(h.created_at)}</span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
