import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
  hint,
}: {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  tone?: 'default' | 'primary' | 'success' | 'warning' | 'destructive' | 'info';
  hint?: string;
}) {
  const toneClass = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-100 text-emerald-600',
    warning: 'bg-amber-100 text-amber-600',
    destructive: 'bg-red-100 text-red-600',
    info: 'bg-blue-100 text-blue-600',
  }[tone];
  return (
    <Card className="relative overflow-hidden p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', toneClass)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
