import { cn } from "@/lib/utils";
import { Agent } from "@/types/agent";
import { Message } from "@/types/discussion";
import { useRef } from "react";
import { MessageInput } from "./MessageInput";
import { MessageList, MessageListRef } from "./MessageList";

interface ChatAreaProps {
  messages: Message[];
  agents: Agent[];
  onSendMessage: (content: string, agentId: string) => Promise<void>;
  getAgentName: (agentId: string) => string;
  getAgentAvatar: (agentId: string) => string;
  className?: string;
  messageListClassName?: string;
  inputAreaClassName?: string;
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
  agents,
  onSendMessage,
  getAgentName,
  getAgentAvatar,
  className,
  messageListClassName,
  inputAreaClassName,
  onStartDiscussion,
}: ChatAreaProps) {
  const messageListRef = useRef<MessageListRef>(null);
  const isFirstMessage = messages.length === 0;

  // 创建一个 agent 信息获取器对象，避免传递多个函数
  const agentInfoGetter = {
    getName: getAgentName,
    getAvatar: getAgentAvatar,
  };

  return (
    <div className={cn(defaultClasses.root, className)} data-testid="chat-area-root">
      <MessageList
        ref={messageListRef}
        messages={messages}
        agentInfo={agentInfoGetter}
        className={cn(defaultClasses.messageList, messageListClassName)}
        data-testid="chat-message-list"
      />

      <div className={cn(defaultClasses.inputArea, inputAreaClassName)} data-testid="chat-input-area">
        <MessageInput
          agents={agents}
          isFirstMessage={isFirstMessage}
          onStartDiscussion={onStartDiscussion}
          onSendMessage={async (content, agentId) => {
            await onSendMessage(content, agentId);
            messageListRef.current?.scrollToBottom();
          }}
          className={defaultClasses.inputWrapper}
          data-testid="chat-message-input"
        />
      </div>
    </div>
  );
}
