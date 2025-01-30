import { RefObject, useRef, useEffect } from "react";

interface AutoScrollOptions {
  autoScrollMode?: "always" | "smart" | "none";
  bottomThreshold?: number;
  smoothScrollThreshold?: number; // 超过这个距离就不使用平滑滚动
}

export function useAutoScroll(
  containerRef: RefObject<HTMLDivElement>,
  content: unknown,
  options: AutoScrollOptions = {}
) {
  const {
    autoScrollMode = "smart",
    bottomThreshold = 100,
    smoothScrollThreshold = 1000, // 默认 1000px
  } = options;

  const isNearBottomRef = useRef(true);
  const prevContentRef = useRef(content);

  const checkIfNearBottom = () => {
    const container = containerRef.current;
    if (!container) return false;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    return distanceToBottom <= bottomThreshold;
  };

  const scrollToBottom = (instant?: boolean) => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;

    // 如果滚动距离超过阈值，或者指定了 instant，就使用即时滚动
    const shouldUseInstant =
      instant || distanceToBottom > smoothScrollThreshold;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: shouldUseInstant ? "auto" : "smooth",
    });
  };

  // 监听内容变化
  useEffect(() => {
    if (prevContentRef.current === content) return;
    prevContentRef.current = content;

    switch (autoScrollMode) {
      case "always":
        scrollToBottom();
        break;
      case "smart":
        console.log(
          isNearBottomRef.current
        );
        if (isNearBottomRef.current) {
          scrollToBottom();
        }
        break;
    }
  }, [content, autoScrollMode]);

  isNearBottomRef.current = checkIfNearBottom();

  return {
    isNearBottom: isNearBottomRef.current,
    scrollToBottom,
  };
}
