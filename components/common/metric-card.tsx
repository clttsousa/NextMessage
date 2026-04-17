import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function MetricCard({ label, value, tone = 'default', hint }: { label: string; value: number; tone?: 'default' | 'primary' | 'warning' | 'success'; hint?: string }) {
  const toneClasses = {
    default: 'border-slate-800',
    primary: 'border-blue-500/30 bg-blue-500/5',
    warning: 'border-amber-500/30 bg-amber-500/5',
    success: 'border-emerald-500/30 bg-emerald-500/5'
  };

  return (
    <Card className={cn('p-4', toneClasses[tone])}>
      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </Card>
  );
}
