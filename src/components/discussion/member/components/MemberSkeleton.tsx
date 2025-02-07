import { cn } from "@/lib/utils";

interface MemberSkeletonProps {
  className?: string;
}

export function MemberSkeleton({ className }: MemberSkeletonProps) {
  return (
    <div className={cn("flex items-center gap-3 animate-pulse", className)}>
      <div className="w-8 h-8 rounded-full bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-24 bg-muted rounded" />
        <div className="h-2 w-32 bg-muted rounded" />
      </div>
    </div>
  );
} 