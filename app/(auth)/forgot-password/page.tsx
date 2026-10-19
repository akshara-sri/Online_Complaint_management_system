'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MailCheck, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Request failed', description: error.message, variant: 'destructive' });
      return;
    }
    setSent(true);
    toast({
      title: 'Reset link sent',
      description: 'Check your inbox for a password reset link.',
    });
  }

  if (sent) {
    return (
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-1">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            If an account exists for <strong>{email}</strong>, a reset link is on its way.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to login
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Forgot password</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send reset link
          </Button>
        </form>
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="inline-flex items-center font-medium text-primary hover:underline">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
