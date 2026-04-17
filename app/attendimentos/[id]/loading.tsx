import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingAttendanceDetail() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
      <Skeleton className="h-[560px] w-full" />
      <Skeleton className="h-[320px] w-full" />
    </div>
  );
}
