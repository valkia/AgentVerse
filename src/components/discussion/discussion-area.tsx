import { useAgents } from "@/hooks/useAgents";
import { useDiscussionMembers } from "@/hooks/useDiscussionMembers";
import { cn } from "@/lib/utils";
import { DiscussionSetupContainer } from "./discussion-setup-container";
import { MessageList } from "../chat/message-list";
import { MessageInput } from "../chat/message-input";
import { DiscussionController } from "./discussion-controller";
import { useMessages } from "@/hooks/useMessages";
import { AgentMessage } from "@/types/discussion";

interface DiscussionAreaProps {
  className?: string;
}

export function DiscussionArea({ className }: DiscussionAreaProps) {
  const { getAgentName, getAgentAvatar } = useAgents();
  const { members } = useDiscussionMembers();
  const { messages, addMessage } = useMessages();

  const handleSendMessage = async (params: {
    content: string;
    agentId: string;
    type?: AgentMessage["type"];
    replyTo?: string;
  }): Promise<AgentMessage | undefined> => {
    return addMessage(params);
  };

  const handleUserMessage = async (content: string) => {
    await handleSendMessage({
      content,
      agentId: "user",
      type: "text",
    });
  };

  // 如果没有成员，显示设置页面
  if (members.length === 0) {
    return <DiscussionSetupContainer className={className} />;
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <DiscussionController
        status="active"
        onSendMessage={handleSendMessage}
      />
      <div className="flex-1 min-h-0">
        <MessageList
          messages={messages}
          agentInfo={{
            getName: getAgentName,
            getAvatar: getAgentAvatar,
          }}
        />
      </div>
      <MessageInput
        onSendMessage={handleUserMessage}
      />
    </div>
  );
} 