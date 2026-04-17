export function Timeline({ items }: { items: Array<{ id: string; title: string; subtitle: string; meta: string }> }) {
  return (
    <ol className="relative ml-2 space-y-4 border-l border-slate-700 pl-5">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span className="absolute -left-[1.75rem] top-1 h-3 w-3 rounded-full border border-blue-300 bg-slate-950" />
          <p className="text-sm font-medium text-slate-100">{item.title}</p>
          <p className="text-xs text-slate-400">{item.subtitle}</p>
          <p className="mt-1 text-xs text-slate-500">{item.meta}</p>
        </li>
      ))}
    </ol>
  );
}
