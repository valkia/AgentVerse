import { useBreakpointContext } from "@/contexts/breakpoint-context";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ResponsiveContainerProps {
  children?: ReactNode;
  className?: string;
  sidebarContent?: ReactNode;
  mainContent: ReactNode;
  showMobileSidebar?: boolean;
  onMobileSidebarChange?: (show: boolean) => void;
}

export function ResponsiveContainer({
  className,
  sidebarContent,
  mainContent,
  showMobileSidebar = false,
  onMobileSidebarChange,
}: ResponsiveContainerProps) {
  const { isLessThan } = useBreakpointContext();

  return (
    <div className={cn("h-full w-full overflow-hidden flex", className)}>
      {sidebarContent && (
        <>
          <div
            className={cn(
              "w-[280px] h-full border-r border-border bg-card",
              "fixed lg:relative inset-y-0 left-0 z-50",
              "transform transition-transform duration-300 ease-in-out",
              showMobileSidebar
                ? "translate-x-0"
                : "-translate-x-full lg:translate-x-0"
            )}
          >
            {sidebarContent}
          </div>
          {isLessThan("lg") && showMobileSidebar && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => onMobileSidebarChange?.(false)}
            />
          )}
        </>
      )}
      <div className="flex-1 min-h-0 flex flex-col overflow-auto">
        {mainContent}
      </div>
    </div>
  );
}
