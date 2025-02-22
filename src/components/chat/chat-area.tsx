import { DEFAULT_SCENARIOS } from "@/config/guide-scenarios";
import { useDiscussionMembers } from "@/hooks/useDiscussionMembers";
import { useDiscussions } from "@/hooks/useDiscussions";
import { cn } from "@/lib/utils";
import { discussionControlService } from "@/services/discussion-control.service";
import { AgentMessage } from "@/types/discussion";
import { AnimatePresence, motion } from "framer-motion";
import { useRef } from "react";
import { ChatEmptyGuide } from "./chat-empty-guide";
import { MessageList, MessageListRef } from "./message";
import { MessageInput, MessageInputRef } from "./message-input";
import { useViewportHeight } from "@/hooks/useViewportHeight";

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

export function ChatArea({
  messages,
  onSendMessage,
  getAgentName,
  getAgentAvatar,
  className,
  messageListClassName,
  inputAreaClassName,
}: ChatAreaProps) {
  const { isKeyboardVisible } = useViewportHeight();
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

  const agentInfoGetter = {
    getName: getAgentName,
    getAvatar: getAgentAvatar,
  };

  if (!currentDiscussion) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        请选择或创建一个会话
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* 消息列表区域 - 自动收缩区域 */}
      <div className={cn(
        "flex-1 min-h-0 overflow-y-auto pl-4 relative scrollbar-thin",
        messageListClassName
      )}>
        <AnimatePresence mode="wait">
          {messages.length === 0 ? (
            <motion.div
              key="empty-guide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-4 pr-4"
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
              data-testid="chat-message-list"
              className="py-4 pr-4"
            />
          )}
        </AnimatePresence>
      </div>

      {/* 输入框区域 */}
      <div className={cn(
        "flex-none border-t dark:border-gray-700",
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        isKeyboardVisible && "shadow-lg",
        inputAreaClassName
      )}>
        <MessageInput
          ref={messageInputRef}
          isFirstMessage={isFirstMessage}
          onSendMessage={handleSendMessage}
          data-testid="chat-message-input"
        />
      </div>
    </div>
  );
}
