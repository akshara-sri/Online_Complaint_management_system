'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/auth-provider';
import { ComplaintDetail } from '@/components/shared/complaint-detail';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { STATUS_META, STATUS_VALUES, type Complaint, type ComplaintStatus, type Profile } from '@/lib/types';
import { Loader2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function AdminComplaintDetailPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [admins, setAdmins] = useState<Profile[]>([]);
  const [status, setStatus] = useState<ComplaintStatus>('submitted');
  const [assignTo, setAssignTo] = useState<string>('unassigned');
  const [remarks, setRemarks] = useState('');
  const [resolution, setResolution] = useState('');
  const [acting, setActing] = useState(false);

  async function loadComplaint() {
    const { data } = await supabase.from('complaints').select('*').eq('id', params.id).maybeSingle();
    if (data) {
      setComplaint(data as Complaint);
      setStatus((data as Complaint).status);
      setAssignTo((data as Complaint).assigned_to ?? 'unassigned');
    }
  }

  useEffect(() => {
    (async () => {
      await loadComplaint();
      const { data: a } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'admin');
      setAdmins((a ?? []) as Profile[]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleUpdate() {
    if (status === 'rejected' && !remarks.trim()) {
      toast({ title: 'Reason required', description: 'A rejection reason is mandatory.', variant: 'destructive' });
      return;
    }
    if (status === 'resolved' && !resolution.trim()) {
      toast({ title: 'Resolution required', description: 'Provide resolution details before resolving.', variant: 'destructive' });
      return;
    }
    setActing(true);
    const { data, error } = await supabase.rpc('update_complaint_status', {
      p_complaint_id: params.id,
      p_new_status: status,
      p_remarks: remarks || null,
      p_assigned_to: assignTo === 'unassigned' ? null : assignTo,
      p_resolution_details: status === 'resolved' ? resolution : null,
    });
    setActing(false);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
      return;
    }
    setComplaint(data as Complaint);
    setRemarks('');
    setResolution('');
    toast({ title: 'Complaint updated', description: `Status set to ${STATUS_META[status].label}.` });
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/admin/complaints">← All complaints</Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ComplaintDetail complaintId={params.id} isAdmin backHref="/admin/complaints" />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Manage complaint</CardTitle>
              <CardDescription>Update status, assignment, and resolution. The user will be notified automatically.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                Acting as administrator: {profile?.full_name}
              </div>
              <div className="space-y-2">
                <Label>New status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ComplaintStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_VALUES.map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assign to administrator</Label>
                <Select value={assignTo} onValueChange={setAssignTo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {admins.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {status === 'resolved' && (
                <div className="space-y-2">
                  <Label>Resolution details *</Label>
                  <Textarea rows={3} value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Describe how this complaint was resolved…" />
                </div>
              )}
              <div className="space-y-2">
                <Label>Remarks {status === 'rejected' ? '*' : '(optional)'}</Label>
                <Textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Notes visible to the user in their timeline…" />
              </div>
              <Button className="w-full" onClick={handleUpdate} disabled={acting || !complaint}>
                {acting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Apply update
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
