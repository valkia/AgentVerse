import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/ui/markdown";
import {
  ScrollableLayout,
  ScrollableLayoutRef,
} from "@/layouts/scrollable-layout";
import { cn } from "@/lib/utils";
import { Message } from "@/types/discussion";
import { ArrowDown } from "lucide-react";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";

interface MessageItemProps {
  message: Message;
  agentInfo: {
    getName: (agentId: string) => string;
    getAvatar: (agentId: string) => string;
  };
}

function MessageItem({ message, agentInfo }: MessageItemProps) {
  const { getName, getAvatar } = agentInfo;

  return (
    <div className="group animate-fadeIn">
      <div className="flex items-start gap-3">
        <Avatar className="w-8 h-8 border border-transparent group-hover:border-purple-500/50 transition-colors">
          <AvatarImage src={getAvatar(message.agentId)} />
          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white text-xs">
            {getName(message.agentId)[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-medium text-sm dark:text-gray-200">
              {getName(message.agentId)}
            </div>
            <time className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(message.timestamp).toLocaleTimeString()}
            </time>
          </div>
          <div className="mt-1 text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-lg break-words">
            <Markdown content={message.content} />
          </div>
        </div>
      </div>
    </div>
  );
}

interface MessageListProps {
  messages: Message[];
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
      scrollButtonThreshold = 200, // 默认 200px
    },
    ref
  ) {
    const scrollableLayoutRef = useRef<ScrollableLayoutRef>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);

    useImperativeHandle(ref, () => ({
      scrollToBottom: () => scrollableLayoutRef.current?.scrollToBottom(),
    }));

    const handleScroll = (scrollTop: number, maxScroll: number) => {
      const distanceToBottom = maxScroll - scrollTop;
      setShowScrollButton(
        maxScroll > 0 && distanceToBottom > scrollButtonThreshold
      );
    };

    return (
      <div className="relative h-full">
        <div className="absolute inset-0">
          <ScrollableLayout
            ref={scrollableLayoutRef}
            className={cn("h-full", className)}
            initialAlignment="bottom"
            autoScrollMode="smart"
            onScroll={handleScroll}
          >
            <div className="py-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    agentInfo={agentInfo}
                  />
                ))}
              </div>
            </div>
          </ScrollableLayout>
        </div>
        {showScrollButton && (
          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 bottom-4 rounded-full shadow-lg bg-background/80 backdrop-blur hover:bg-background z-10"
            onClick={() => scrollableLayoutRef.current?.scrollToBottom()}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }
);
