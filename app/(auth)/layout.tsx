import Link from 'next/link';
import { Logo } from '@/components/logo';
import { ShieldCheck, BarChart3, Bell } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary to-blue-700 p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(40%_60%_at_70%_20%,rgba(255,255,255,0.15),transparent)]" />
        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2 text-white">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 backdrop-blur">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">OCMS</span>
          </Link>
        </div>
        <div className="relative space-y-6">
          <h2 className="text-3xl font-bold leading-tight">
            Your Voice Matters — Submit, Track, Resolve.
          </h2>
          <p className="max-w-md text-white/80">
            A complete complaint management platform with real-time tracking, role-based access,
            and transparent resolution workflows.
          </p>
          <div className="grid gap-3">
            {[
              { icon: ShieldCheck, t: 'Secure role-based access' },
              { icon: BarChart3, t: 'Live analytics and reports' },
              { icon: Bell, t: 'Instant in-app notifications' },
            ].map((f) => (
              <div key={f.t} className="flex items-center gap-3 text-sm text-white/90">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/15">
                  <f.icon className="h-4 w-4" />
                </div>
                {f.t}
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-sm text-white/70">
          Online Complaint Management System — Academic Project
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-4 lg:hidden">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md animate-fade-in">{children}</div>
        </div>
      </div>
    </div>
  );
}
