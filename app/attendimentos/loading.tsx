import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingAttendances() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-[520px] w-full" />
    </div>
  );
}
