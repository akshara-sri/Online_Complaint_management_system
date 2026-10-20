'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Department } from '@/lib/types';
import { Loader2, FolderTree, Plus, Trash2 } from 'lucide-react';

export default function CategoriesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [depts, setDepts] = useState<Department[]>([]);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [adding, setAdding] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('departments').select('*').order('name');
    setDepts((data ?? []) as Department[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    const { error } = await supabase
      .from('departments')
      .insert({ name: name.trim(), description: desc.trim() || null });
    setAdding(false);
    if (error) {
      toast({ title: 'Add failed', description: error.message, variant: 'destructive' });
      return;
    }
    setName('');
    setDesc('');
    toast({ title: 'Department added' });
    load();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('departments').delete().eq('id', id);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Department removed' });
    load();
  }

  return (
    <div>
      <PageHeader title="Categories & departments" description="Manage the reference list of departments used when triaging complaints." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Departments ({depts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/40" />
                ))}
              </div>
            ) : depts.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No departments yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {depts.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 py-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                      <FolderTree className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{d.name}</p>
                      {d.description && (
                        <p className="truncate text-xs text-muted-foreground">{d.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(d.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add department</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Transport" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Input id="desc" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional" />
              </div>
              <Button type="submit" className="w-full" disabled={adding}>
                {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Add department
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
