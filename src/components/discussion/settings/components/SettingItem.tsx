import { cn } from "@/lib/utils";

interface SettingItemProps {
  label: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function SettingItem({
  label,
  description,
  children,
  className,
}: SettingItemProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="flex-1 space-y-0.5">
        <div className="text-sm font-medium">{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground">{description}</div>
        )}
      </div>
      {children}
    </div>
  );
} 