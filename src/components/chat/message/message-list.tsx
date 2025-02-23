import { Button } from "@/components/ui/button";
import {
  ScrollableLayout,
  ScrollableLayoutRef,
} from "@/layouts/scrollable-layout";
import { reorganizeMessages } from "@/lib/discussion/message-utils";
import { cn } from "@/lib/utils";
import { AgentMessage } from "@/types/discussion";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { MessageCapture } from "./message-capture";
import { MessageItem } from "./message-item";

interface MessageListProps {
  discussionId?: string;
  messages: AgentMessage[];
  agentInfo: {
    getName: (agentId: string) => string;
    getAvatar: (agentId: string) => string;
  };
  className?: string;
  scrollButtonThreshold?: number; // 显示滚动按钮的阈值
}

export type MessageListRef = {
  scrollToBottom: (instant?: boolean) => void;
};

export const MessageList = forwardRef<MessageListRef, MessageListProps>(
  function MessageList(
    {
      messages,
      agentInfo,
      className,
      scrollButtonThreshold = 200,
      discussionId,
    },
    ref
  ) {
    const scrollableLayoutRef = useRef<ScrollableLayoutRef>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useImperativeHandle(ref, () => ({
      scrollToBottom: () => scrollableLayoutRef.current?.scrollToBottom(),
    }));

    const handleScroll = (scrollTop: number, maxScroll: number) => {
      const distanceToBottom = maxScroll - scrollTop;
      setShowScrollButton(
        maxScroll > 0 && distanceToBottom > scrollButtonThreshold
      );
    };

    useEffect(() => {
      // 开始过渡
      setIsTransitioning(true);

      // 等待下一帧，让过渡效果生效
      requestAnimationFrame(() => {
        // 执行即时滚动
        scrollableLayoutRef.current?.scrollToBottom(true);

        // 300ms 后结束过渡
        setTimeout(() => {
          setIsTransitioning(false);
        }, 300);
      });
    }, [discussionId]);

    const reorganizedMessages = reorganizeMessages(messages);

    return (
      <div className="relative h-full">
        <div className="absolute inset-0">
          <ScrollableLayout
            ref={scrollableLayoutRef}
            className={cn("h-full overflow-x-hidden", className)}
            initialAlignment="bottom"
            unpinThreshold={1}
            pinThreshold={30}
            onScroll={handleScroll}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={discussionId}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 0.2 },
                }}
                exit={{ opacity: 0 }}
                className={cn(
                  "py-4 transition-opacity duration-200",
                  isTransitioning && "opacity-0"
                )}
                ref={messagesContainerRef}
              >
                <div className="space-y-6">
                  {reorganizedMessages.map((message) => (
                    <MessageItem
                      key={message.id}
                      message={message}
                      agentInfo={agentInfo}
                    />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </ScrollableLayout>
        </div>

        {/* 浮动按钮组 */}
        <div className="absolute right-4 bottom-4 flex flex-col gap-2">
          <MessageCapture
            containerRef={messagesContainerRef}
            className="rounded-full shadow-lg bg-background/80 backdrop-blur hover:bg-background"
          />

          {showScrollButton && (
            <Button
              variant="outline"
              size="icon"
              className="rounded-full shadow-lg bg-background/80 backdrop-blur hover:bg-background"
              onClick={() => scrollableLayoutRef.current?.scrollToBottom()}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }
);
