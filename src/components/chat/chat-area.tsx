import { DEFAULT_SCENARIOS } from "@/config/guide-scenarios";
import { useDiscussionMembers } from "@/hooks/useDiscussionMembers";
import { useDiscussions } from "@/hooks/useDiscussions";
import { cn } from "@/lib/utils";
import { discussionControlService } from "@/services/discussion-control.service";
import { AgentMessage } from "@/types/discussion";
import { useRef } from "react";
import { ChatEmptyGuide } from "./chat-empty-guide";
import { MessageInput, MessageInputRef } from "./message-input";
import { MessageList, MessageListRef } from "./message-list";
import { AnimatePresence, motion } from "framer-motion";

interface ChatAreaProps {
  messages: AgentMessage[];
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
  const messageInputRef = useRef<MessageInputRef>(null);
  const isFirstMessage = messages.length === 0;
  const { currentDiscussion } = useDiscussions();
  const { members } = useDiscussionMembers();

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

  if (!currentDiscussion) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        请选择或创建一个会话
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col flex-1 overflow-hidden h-full", className)}>
      <div className="flex-1 min-h-0 relative">
        <AnimatePresence mode="wait">
          {messages.length === 0 ? (
            <motion.div
              key="empty-guide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 overflow-auto"
            >
              <ChatEmptyGuide
                scenarios={DEFAULT_SCENARIOS}
                membersCount={members.length}
                onSuggestionClick={(template) => {
                  messageInputRef.current?.setValue(template);
                  messageInputRef.current?.focus();
                }}
              />
            </motion.div>
          ) : (
            <MessageList
              ref={messageListRef}
              messages={messages}
              agentInfo={agentInfoGetter}
              className={cn(defaultClasses.messageList, messageListClassName)}
              data-testid="chat-message-list"
            />
          )}
        </AnimatePresence>
      </div>

      <div
        className={cn(
          "flex-none border-t dark:border-gray-700",
          "relative",
          inputAreaClassName
        )}
        data-testid="chat-input-area"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 to-background/95 dark:from-gray-900/60 dark:to-gray-900/95 pointer-events-none" />
        
        <div className="absolute inset-0 backdrop-blur-sm pointer-events-none" />

        <div className="relative">
          <MessageInput
            ref={messageInputRef}
            isFirstMessage={isFirstMessage}
            onSendMessage={handleSendMessage}
            className={cn(
              defaultClasses.inputWrapper,
              "bg-gray-50/80 dark:bg-gray-800/80"
            )}
            data-testid="chat-message-input"
          />
        </div>
      </div>
    </div>
  );
}
