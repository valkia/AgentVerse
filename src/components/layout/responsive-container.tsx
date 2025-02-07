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
  onMobileSidebarChange
}: ResponsiveContainerProps) {
  return (
    <div className={cn(
      "h-full w-full overflow-hidden",
      className
    )}>
      {/* 移动端侧边栏 */}
      {sidebarContent && (
        <div className={cn(
          "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden",
          showMobileSidebar ? "block" : "hidden"
        )}>
          <div className="absolute inset-y-0 left-0 w-[280px] bg-background border-r">
            <div className="h-full overflow-y-auto">
              {sidebarContent}
            </div>
          </div>
          {/* 点击背景关闭侧边栏 */}
          <div 
            className="absolute inset-0 bg-transparent"
            onClick={() => onMobileSidebarChange?.(false)}
          />
        </div>
      )}

      {/* 移动端主内容 */}
      <div className="block lg:hidden h-full">
        <div className="h-full flex flex-col">
          {mainContent}
        </div>
      </div>

      {/* 桌面端布局 */}
      <div className="hidden lg:grid lg:grid-cols-[280px_1fr] h-full">
        {/* 桌面端侧边栏 */}
        {sidebarContent && (
          <div className="h-full border-r overflow-y-auto">
            {sidebarContent}
          </div>
        )}
        {/* 桌面端主内容 */}
        <div className="h-full overflow-y-auto">
          {mainContent}
        </div>
      </div>
    </div>
  );
} 