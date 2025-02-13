import { MessageMarkdownContent } from "@/components/chat/agent-action-display";
import { QuickMemberSelector } from "@/components/discussion/member/quick-member-selector";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useDiscussionMembers } from "@/hooks/useDiscussionMembers";
import {
  ScrollableLayout,
  ScrollableLayoutRef,
} from "@/layouts/scrollable-layout";
import { reorganizeMessages } from "@/lib/discussion/message-utils";
import { cn } from "@/lib/utils";
import { AgentMessage, MessageWithResults } from "@/types/discussion";
import { ArrowDown, Check, Copy } from "lucide-react";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";

interface MessageItemProps {
  message: MessageWithResults;
  agentInfo: {
    getName: (agentId: string) => string;
    getAvatar: (agentId: string) => string;
  };
}

function MessageItem({ message, agentInfo }: MessageItemProps) {
  const { getName, getAvatar } = agentInfo;
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const isUserMessage = message.agentId === "user";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast({
        description: "已复制到剪贴板",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        variant: "destructive",
        description: "复制失败",
      });
    }
  };

  return (
    <div className="group animate-fadeIn hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-200">
      <div className="px-2 sm:px-4 py-2 max-w-full sm:max-w-3xl mx-auto">
        {/* 移动端：头像和名称在上方 */}
        <div className={cn(
          "sm:hidden flex items-center gap-2 mb-2",
          isUserMessage ? "justify-end" : "justify-start"
        )}>
          <Avatar className="w-5 h-5 shrink-0">
            <AvatarImage src={getAvatar(message.agentId)} />
            <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white text-[10px]">
              {getName(message.agentId)[0]}
            </AvatarFallback>
          </Avatar>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {getName(message.agentId)}
          </div>
          <time className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(message.timestamp).toLocaleTimeString()}
          </time>
        </div>

        {/* 桌面端：传统的左侧头像布局 */}
        <div className="hidden sm:flex items-start gap-3">
          <Avatar className="w-8 h-8 shrink-0 ring-2 ring-transparent group-hover:ring-purple-500/30 transition-all duration-200">
            <AvatarImage src={getAvatar(message.agentId)} />
            <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white text-xs">
              {getName(message.agentId)[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                {getName(message.agentId)}
              </div>
              <time className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(message.timestamp).toLocaleTimeString()}
              </time>
            </div>
          </div>
        </div>

        {/* 消息内容 - 移动端全宽显示 */}
        <div className="relative">
          <div className={cn(
            "text-sm text-gray-700 dark:text-gray-200",
            // 移动端样式：全宽，无边框
            "px-0 sm:px-4 py-1 sm:py-3",
            // 桌面端样式：保持卡片设计
            "sm:bg-white sm:dark:bg-gray-800",
            "sm:border sm:border-gray-200 sm:dark:border-gray-700",
            "sm:group-hover:border-gray-300 sm:dark:group-hover:border-gray-600",
            "sm:rounded-xl sm:break-words",
            "sm:shadow-sm sm:group-hover:shadow-md",
            "transition-all duration-200",
            // 桌面端的左侧留白（为头像空间）
            "sm:ml-11"
          )}>
            <div className={cn("space-y-2", isUserMessage && "pr-6")}>
              <MessageMarkdownContent
                content={message.content}
                actionResults={message.actionResults}
              />
              {/* 复制按钮保持不变 */}
              {isUserMessage ? (
                <button
                  onClick={handleCopy}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all"
                  title={copied ? "已复制" : "复制"}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-4 mt-1.5">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span className="text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {copied ? "已复制" : "复制"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MessageListProps {
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
      scrollButtonThreshold = 200, // 默认 200px
    },
    ref
  ) {
    const { members } = useDiscussionMembers();
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

    // 如果没有成员，显示引导页面
    if (members.length === 0) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="max-w-2xl w-full p-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold tracking-tight">
                开始一场新的讨论
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                选择合适的成员来启动讨论
              </p>
            </div>

            <div className="space-y-6">
              {/* 快速选择区域 */}
              <div>
                <h3 className="text-sm font-medium mb-3">推荐组合</h3>
                <QuickMemberSelector />
              </div>

              {/* 或者分割线 */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    或者
                  </span>
                </div>
              </div>

              {/* 手动选择区域 */}
              <div>
                <h3 className="text-sm font-medium mb-3">自定义组合</h3>
                {/* TODO: 添加自定义成员选择器 */}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 重组消息
    const reorganizedMessages = reorganizeMessages(messages);

    return (
      <div className="relative h-full">
        <div className="absolute inset-0">
          <ScrollableLayout
            ref={scrollableLayoutRef}
            className={cn("h-full overflow-x-hidden", className)}
            initialAlignment="bottom"
            autoScrollMode="smart"
            onScroll={handleScroll}
          >
            <div className="py-4">
              <div className="space-y-6">
                {reorganizedMessages.map((message) => (
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
