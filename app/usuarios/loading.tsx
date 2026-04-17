import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingUsers() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-72 w-full" />
      <Skeleton className="h-[420px] w-full" />
    </div>
  );
}
