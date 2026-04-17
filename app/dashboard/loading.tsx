import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingDashboard() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.35fr,1fr]">
        <Skeleton className="h-[420px] w-full" />
        <div className="space-y-4"><Skeleton className="h-52 w-full" /><Skeleton className="h-52 w-full" /></div>
      </div>
    </div>
  );
}
