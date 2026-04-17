import { cn } from '@/lib/utils';

function getInitials(name?: string | null) {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join('');
}

export function AvatarInitials({ name, className }: { name?: string | null; className?: string }) {
  return (
    <div className={cn('inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-600 bg-slate-800 text-xs font-semibold text-slate-100', className)}>
      {getInitials(name)}
    </div>
  );
}
