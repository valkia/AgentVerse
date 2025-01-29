import { ReactNode, useRef, useEffect, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { useAutoScroll } from "@/hooks/useAutoScroll";

interface ScrollableLayoutProps {
  children: ReactNode;
  className?: string;
  initialAlignment?: "top" | "bottom";
  onScroll?: (scrollTop: number, maxScroll: number) => void;
  autoScrollMode?: "always" | "smart" | "none";  // 自动滚动模式
  bottomThreshold?: number;  // 判定为"接近底部"的阈值
}

export const ScrollableLayout = forwardRef<HTMLDivElement, ScrollableLayoutProps>(
  function ScrollableLayout({
    children,
    className,
    initialAlignment = "top",
    onScroll,
    autoScrollMode = "smart",  // 默认使用智能模式
    bottomThreshold = 100
  }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    
    const { scrollToBottom, updateIsNearBottom } = useAutoScroll(containerRef, children, {
      autoScrollMode,
      bottomThreshold
    });

    // 初始化滚动位置
    useEffect(() => {
      if (initialAlignment === "bottom") {
        scrollToBottom(true);
      }
    }, [initialAlignment]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const container = e.currentTarget;
      const { scrollTop, scrollHeight, clientHeight } = container;
      const maxScroll = scrollHeight - clientHeight;
      
      updateIsNearBottom();
      onScroll?.(scrollTop, maxScroll);
    };

    return (
      <div
        ref={ref}
        className={cn("overflow-y-auto", className)}
        onScroll={handleScroll}
        style={{ scrollBehavior: "smooth" }}
      >
        {children}
      </div>
    );
  }
); 