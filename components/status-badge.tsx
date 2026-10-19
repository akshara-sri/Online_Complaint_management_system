import { cn } from '@/lib/utils';
import { STATUS_META, PRIORITY_META, type ComplaintStatus, type ComplaintPriority } from '@/lib/types';

export function StatusBadge({
  status,
  className,
}: {
  status: ComplaintStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        meta.badgeClass,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dotClass)} />
      {meta.label}
    </span>
  );
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: ComplaintPriority;
  className?: string;
}) {
  const meta = PRIORITY_META[priority];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        meta.badgeClass,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
