import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingAudit() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-44 w-full" />)}
    </div>
  );
}
