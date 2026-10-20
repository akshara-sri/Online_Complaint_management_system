'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { PageHeader, RowSkeleton } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge, PriorityBadge } from '@/components/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import type { Complaint, Profile } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { Inbox, UserCog, Loader2 } from 'lucide-react';

export default function AssignComplaintsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<(Complaint & { user?: Profile })[]>([]);
  const [admins, setAdmins] = useState<Profile[]>([]);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: a }] = await Promise.all([
        supabase
          .from('complaints')
          .select('*, user:user_id(full_name, email)')
          .order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name').eq('role', 'admin'),
      ]);
      setComplaints((c ?? []) as (Complaint & { user?: Profile })[]);
      setAdmins((a ?? []) as Profile[]);
      setLoading(false);
    })();
  }, []);

  async function quickAssign(complaintId: string, adminId: string) {
    setAssigning(complaintId);
    const { error } = await supabase
      .from('complaints')
      .update({ assigned_to: adminId === 'unassigned' ? null : adminId })
      .eq('id', complaintId);
    setAssigning(null);
    if (error) {
      toast({ title: 'Assignment failed', description: error.message, variant: 'destructive' });
      return;
    }
    setComplaints((prev) =>
      prev.map((c) => (c.id === complaintId ? { ...c, assigned_to: adminId === 'unassigned' ? null : adminId } : c)),
    );
    toast({ title: 'Assigned', description: 'Complaint assignment updated.' });
  }

  return (
    <div>
      <PageHeader
        title="Assign complaints"
        description="Quickly assign administrators to complaints that need ownership."
      />
      <Card>
        {loading ? (
          <div className="p-4"><RowSkeleton rows={6} /></div>
        ) : complaints.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={Inbox} title="No complaints" description="There are no complaints to assign." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Assign to</TableHead>
                  <TableHead className="text-right">Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaints.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.reference_number}</TableCell>
                    <TableCell className="max-w-[200px] truncate font-medium">{c.title}</TableCell>
                    <TableCell><PriorityBadge priority={c.priority} /></TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(c.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          value={c.assigned_to ?? 'unassigned'}
                          onValueChange={(v) => quickAssign(c.id, v)}
                          disabled={assigning === c.id}
                        >
                          <SelectTrigger className="h-8 w-40 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {admins.map((a) => (
                              <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {assigning === c.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/complaints/${c.id}`}>
                          <UserCog className="mr-1.5 h-3.5 w-3.5" /> Open
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
