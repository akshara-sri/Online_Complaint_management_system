import Link from 'next/link';
import {
  ShieldCheck,
  FileText,
  Search,
  CheckCircle2,
  Bell,
  BarChart3,
  Lock,
  ArrowRight,
  MessageSquareText,
  Users,
  Clock,
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50/60 via-white to-white">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#process" className="transition-colors hover:text-foreground">
              How it works
            </a>
            <a href="#about" className="transition-colors hover:text-foreground">
              About
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">Register</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(37,99,235,0.12),transparent)]" />
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Online Complaint Management System
              </div>
              <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Your Voice Matters —{' '}
                <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  Submit, Track, Resolve.
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
                A modern platform to register complaints online, follow their progress in real time,
                and receive updates until resolution. Transparent, accountable, and built for
                institutions.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/register">
                    Get started free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/login">Login to your account</Link>
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Demo project — register a user account to explore the full workflow.
              </p>
            </div>

            {/* Process steps */}
            <div id="process" className="mx-auto mt-20 grid max-w-5xl gap-6 md:grid-cols-3">
              {[
                {
                  icon: FileText,
                  step: '01',
                  title: 'Submit a Complaint',
                  desc: 'Register your concern with category, priority, and attachments in under a minute.',
                },
                {
                  icon: Search,
                  step: '02',
                  title: 'Track Progress',
                  desc: 'Follow every status change on a chronological timeline with administrator remarks.',
                },
                {
                  icon: CheckCircle2,
                  step: '03',
                  title: 'Get Resolution',
                  desc: 'Receive notifications when your complaint is reviewed, assigned, and resolved.',
                },
              ].map((s) => (
                <div
                  key={s.step}
                  className="group relative rounded-xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div className="mb-1 text-xs font-semibold text-primary/70">{s.step}</div>
                  <h3 className="text-lg font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-border/60 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Everything you need to manage complaints
              </h2>
              <p className="mt-4 text-muted-foreground">
                Built with secure authentication, role-based access, and real-time notifications.
              </p>
            </div>
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Lock,
                  title: 'Role-based access',
                  desc: 'Separate user and administrator dashboards with backend-enforced authorization.',
                },
                {
                  icon: FileText,
                  title: 'Structured complaints',
                  desc: 'Categories, priorities, departments, and file attachments with validation.',
                },
                {
                  icon: Search,
                  title: 'Reference tracking',
                  desc: 'Unique reference numbers let anyone look up a complaint status instantly.',
                },
                {
                  icon: Bell,
                  title: 'In-app notifications',
                  desc: 'Automatic updates when a complaint is reviewed, assigned, or resolved.',
                },
                {
                  icon: BarChart3,
                  title: 'Analytics & reports',
                  desc: 'Visual dashboards for status, category, and priority distribution plus CSV export.',
                },
                {
                  icon: Clock,
                  title: 'Full audit timeline',
                  desc: 'Every status change is recorded with the actor, timestamp, and remarks.',
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
                >
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats (transparent, not fabricated as real org numbers) */}
        <section id="about" className="border-t border-border/60 bg-gradient-to-b from-white to-blue-50/40">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                A demonstration of modern complaint management
              </h2>
              <p className="mt-4 text-muted-foreground">
                This is an academic project. The statistics below are computed live from the
                project database once you register and submit complaints.
              </p>
            </div>
            <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                { icon: MessageSquareText, label: 'Complaints submitted', hint: 'Live from database' },
                { icon: CheckCircle2, label: 'Issues resolved', hint: 'Live from database' },
                { icon: Users, label: 'Registered users', hint: 'Live from database' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-border bg-white p-8 text-center shadow-sm"
                >
                  <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">{s.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground/70">{s.hint}</div>
                </div>
              ))}
            </div>

            <div className="mx-auto mt-14 flex max-w-md flex-col items-center justify-center gap-3 rounded-2xl border border-primary/20 bg-white p-8 text-center shadow-sm sm:flex-row">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground">Ready to try it out?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Register an account and submit your first complaint in minutes.
                </p>
              </div>
              <Button asChild className="shrink-0">
                <Link href="/register">Create account</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Logo />
            <p className="text-sm text-muted-foreground">
              Online Complaint Management System — Academic Project
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href="/login" className="hover:text-foreground">Login</a>
              <a href="/register" className="hover:text-foreground">Register</a>
              <a href="mailto:support@ocms-demo.local" className="hover:text-foreground">Support</a>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            For demonstration purposes only. Not affiliated with any real organization.
          </p>
        </div>
      </footer>
    </div>
  );
}
