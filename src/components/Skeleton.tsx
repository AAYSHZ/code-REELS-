import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg animate-shimmer", className)} {...props} />;
}

export function ReelSkeleton() {
  return (
    <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center bg-background">
      <div className="w-full max-w-lg space-y-4 px-4">
        <Skeleton className="w-full aspect-[9/16] rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 pt-20 pb-24 px-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Skeleton className="w-24 h-24 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-16 w-full rounded-xl" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return <Skeleton className="h-32 w-full rounded-xl" />;
}
