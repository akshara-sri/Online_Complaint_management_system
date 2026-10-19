import { cn } from '@/lib/utils';
import { ShieldCheck } from 'lucide-react';

export function Logo({
  className,
  showText = true,
  size = 'md',
}: {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dim = size === 'sm' ? 28 : size === 'lg' ? 40 : 32;
  const text = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-xl';
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className="grid place-items-center rounded-xl bg-gradient-to-br from-primary to-blue-600 text-primary-foreground shadow-sm"
        style={{ width: dim, height: dim }}
      >
        <ShieldCheck className="h-1/2 w-1/2" strokeWidth={2.4} />
      </div>
      {showText && (
        <span className={cn('font-bold tracking-tight text-foreground', text)}>
          OCMS
        </span>
      )}
    </div>
  );
}
