import { Agent, Message } from "@/types/agent";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { cn } from "@/lib/utils";

interface ChatAreaProps {
  messages: Message[];
  agents: Agent[];
  onSendMessage: (content: string, agentId: string) => Promise<void>;
  getAgentName: (agentId: string) => string;
  getAgentAvatar: (agentId: string) => string;
  className?: string;
  messageListClassName?: string;
  inputAreaClassName?: string;
}

const defaultClasses = {
  root: "flex flex-col min-h-0 overflow-hidden",
  messageList: "flex-1 min-h-0 overflow-auto px-4",
  inputArea: "flex-none border-t dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60",
  inputWrapper: "p-4"
} as const;

export function ChatArea({
  messages,
  agents,
  onSendMessage,
  getAgentName,
  getAgentAvatar,
  className,
  messageListClassName,
  inputAreaClassName
}: ChatAreaProps) {
  // 创建一个 agent 信息获取器对象，避免传递多个函数
  const agentInfoGetter = {
    getName: getAgentName,
    getAvatar: getAgentAvatar
  };

  return (
    <div className={cn(defaultClasses.root, className)}>
      <MessageList
        messages={messages}
        agentInfo={agentInfoGetter}
        className={cn(defaultClasses.messageList, messageListClassName)}
      />

      <div className={cn(defaultClasses.inputArea, inputAreaClassName)}>
        <MessageInput
          agents={agents}
          onSendMessage={onSendMessage}
          className={defaultClasses.inputWrapper}
        />
      </div>
    </div>
  );
}