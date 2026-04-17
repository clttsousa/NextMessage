import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingAttendances() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="hidden h-[540px] w-full md:block" />
      <div className="space-y-3 md:hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-44 w-full" />
        ))}
      </div>
    </div>
  );
}
