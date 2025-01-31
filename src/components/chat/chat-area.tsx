import { cn } from "@/lib/utils";
import { discussionControlService } from "@/services/discussion-control.service";
import { Message } from "@/types/discussion";
import { useRef } from "react";
import { MessageInput } from "./message-input";
import { MessageList, MessageListRef } from "./message-list";
import { useBeanState } from "packages/rx-nested-bean/src";

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (content: string, agentId: string) => Promise<void>;
  getAgentName: (agentId: string) => string;
  getAgentAvatar: (agentId: string) => string;
  className?: string;
  messageListClassName?: string;
  inputAreaClassName?: string;
  discussionStatus?: "active" | "paused" | "completed";
  onStartDiscussion?: () => void;
}

const defaultClasses = {
  root: "flex flex-col min-h-0 overflow-hidden h-full",
  messageList: "flex-1 min-h-0 overflow-auto px-4",
  inputArea:
    "flex-none border-t dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60",
  inputWrapper: "p-4",
} as const;

export function ChatArea({
  messages,
  onSendMessage,
  getAgentName,
  getAgentAvatar,
  className,
  messageListClassName,
  inputAreaClassName,
}: ChatAreaProps) {
  const messageListRef = useRef<MessageListRef>(null);
  const { data: currentDiscussionId } = useBeanState(
    discussionControlService.currentDiscussionIdBean
  );
  const isFirstMessage = messages.length === 0;

  const handleSendMessage = async (content: string, agentId: string) => {
    await onSendMessage(content, agentId);
    discussionControlService.run();
    messageListRef.current?.scrollToBottom();
  };

  // 创建一个 agent 信息获取器对象，避免传递多个函数
  const agentInfoGetter = {
    getName: getAgentName,
    getAvatar: getAgentAvatar,
  };

  return (
    <div
      className={cn(defaultClasses.root, className)}
      data-testid="chat-area-root"
      data-discussion-id={currentDiscussionId}
    >
      <MessageList
        ref={messageListRef}
        messages={messages}
        agentInfo={agentInfoGetter}
        className={cn(defaultClasses.messageList, messageListClassName)}
        data-testid="chat-message-list"
      />

      <div
        className={cn(defaultClasses.inputArea, inputAreaClassName)}
        data-testid="chat-input-area"
      >
        <MessageInput
          isFirstMessage={isFirstMessage}
          onSendMessage={handleSendMessage}
          className={defaultClasses.inputWrapper}
          data-testid="chat-message-input"
        />
      </div>
    </div>
  );
}
