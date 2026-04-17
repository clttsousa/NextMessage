import { Card } from '@/components/ui/card';

type DiffEntry = { key: string; oldValue: string; newValue: string; changed: boolean };

function normalize(v: unknown) {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function toDiff(oldValues: Record<string, unknown> | null | undefined, newValues: Record<string, unknown> | null | undefined): DiffEntry[] {
  const keys = Array.from(new Set([...(oldValues ? Object.keys(oldValues) : []), ...(newValues ? Object.keys(newValues) : [])]));
  return keys.map((key) => {
    const oldValue = normalize(oldValues?.[key]);
    const newValue = normalize(newValues?.[key]);
    return { key, oldValue, newValue, changed: oldValue !== newValue };
  });
}

export function SemanticDiff({ oldValues, newValues }: { oldValues: Record<string, unknown> | null; newValues: Record<string, unknown> | null }) {
  const entries = toDiff(oldValues, newValues).filter((entry) => entry.changed);

  if (entries.length === 0) {
    return <p className="text-xs text-slate-400">Sem diferenças registradas.</p>;
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <Card key={entry.key} className="border-blue-500/30 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{entry.key}</p>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Antes</p>
              <p className="mt-1 text-xs text-rose-200">{entry.oldValue}</p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Depois</p>
              <p className="mt-1 text-xs text-emerald-200">{entry.newValue}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
