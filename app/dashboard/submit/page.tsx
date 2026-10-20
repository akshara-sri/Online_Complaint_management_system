'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/providers/auth-provider';
import { PageHeader } from '@/components/shared/page-header';
import { supabase, STORAGE_BUCKET } from '@/lib/supabase';
import { COMPLAINT_CATEGORIES, type ComplaintPriority } from '@/lib/types';
import { FileText, Loader2, Upload, X, CheckCircle2, Copy } from 'lucide-react';
import Link from 'next/link';

const PRIORITIES: { value: ComplaintPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_SIZE = 5 * 1024 * 1024;

export default function SubmitComplaintPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [priority, setPriority] = useState<ComplaintPriority>('medium');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ reference: string; id: string } | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (f) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        toast({ title: 'Unsupported file type', description: 'Allowed: images, PDF, text, Word docs.', variant: 'destructive' });
        return;
      }
      if (f.size > MAX_SIZE) {
        toast({ title: 'File too large', description: 'Maximum size is 5MB.', variant: 'destructive' });
        return;
      }
    }
    setFile(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!title || !category || !description) {
      toast({ title: 'Missing fields', description: 'Title, category, and description are required.', variant: 'destructive' });
      return;
    }
    if (description.length < 20) {
      toast({ title: 'Description too short', description: 'Please provide at least 20 characters.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);

    // Generate reference number via DB function
    const { data: refData, error: refError } = await supabase.rpc('generate_reference_number');
    if (refError || !refData) {
      toast({ title: 'Failed to generate reference', description: refError?.message, variant: 'destructive' });
      setSubmitting(false);
      return;
    }
    const reference = refData as string;

    const { data: complaint, error } = await supabase
      .from('complaints')
      .insert({
        reference_number: reference,
        title,
        category,
        description,
        department: department || null,
        priority,
        status: 'submitted',
      })
      .select()
      .single();

    if (error || !complaint) {
      toast({ title: 'Submission failed', description: error?.message ?? 'Unknown error', variant: 'destructive' });
      setSubmitting(false);
      return;
    }

    // Initial history row
    await supabase.from('complaint_history').insert({
      complaint_id: complaint.id,
      previous_status: null,
      new_status: 'submitted',
      remarks: 'Complaint submitted by user.',
    });

    // Upload file if present
    if (file) {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${complaint.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, { contentType: file.type });
      if (upErr) {
        toast({ title: 'Attachment failed', description: upErr.message, variant: 'destructive' });
      } else {
        await supabase.from('complaint_attachments').insert({
          complaint_id: complaint.id,
          file_path: path,
          file_name: file.name,
          file_size: file.size,
          content_type: file.type,
        });
      }
    }

    setSuccess({ reference, id: complaint.id });
    setSubmitting(false);
  }

  if (success) {
    return (
      <div className="mx-auto max-w-xl">
        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl">Complaint submitted</CardTitle>
            <CardDescription>Your complaint has been recorded successfully.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg border border-border bg-white p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Your reference number
              </p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="font-mono text-xl font-bold text-foreground">{success.reference}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    navigator.clipboard.writeText(success.reference);
                    toast({ title: 'Copied', description: 'Reference number copied.' });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Save this number to track your complaint anytime.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button asChild>
                <Link href={`/dashboard/complaints/${success.id}`}>View complaint details</Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSuccess(null);
                  setTitle('');
                  setCategory('');
                  setDescription('');
                  setDepartment('');
                  setPriority('medium');
                  setFile(null);
                }}
              >
                Submit another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Submit a complaint"
        description="Provide details about your issue. Fields marked * are required."
      />
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Complaint title *</Label>
              <Input
                id="title"
                placeholder="Brief summary of the issue"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPLAINT_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as ComplaintPriority)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department or location</Label>
              <Input
                id="department"
                placeholder="e.g. Hostel Block B, Electrical Dept"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Detailed description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the issue in detail (min 20 characters)…"
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">{description.length} characters</p>
            </div>
            <div className="space-y-2">
              <Label>Attachment (optional)</Label>
              <p className="text-xs text-muted-foreground">Images, PDF, or Word docs up to 5MB.</p>
              {!file ? (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-sm text-muted-foreground transition-colors hover:bg-muted">
                  <Upload className="h-5 w-5" />
                  Click to upload a file
                  <input type="file" className="hidden" onChange={handleFileChange} accept={ALLOWED_TYPES.join(',')} />
                </label>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Submit complaint
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
