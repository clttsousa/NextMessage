export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="surface flex flex-col items-center justify-center gap-2 p-8 text-center">
      <p className="text-base font-semibold">{title}</p>
      <p className="max-w-xl text-sm text-slate-400">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
