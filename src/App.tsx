import { ChatArea } from "@/components/chat/chat-area";
import { DiscussionController } from "@/components/discussion/discussion-controller";
import { DiscussionList } from "@/components/discussion/discussion-list";
import { MemberList } from "@/components/discussion/member-list";
import { Header } from "@/components/layout/header";
import { useAgents } from "@/hooks/useAgents";
import { useMessages } from "@/hooks/useMessages";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { discussionControlService } from "@/services/discussion-control.service";
import { Discussion, NormalMessage } from "@/types/discussion";
import { useEffect } from "react";
import { useBeanState } from "rx-nested-bean";

export function App() {
  const { isDarkMode, toggleDarkMode, rootClassName } = useTheme();
  const { getAgentName, getAgentAvatar } = useAgents();
  const { messages, addMessage } = useMessages();
  const { data: currentDiscussionId } = useBeanState(
    discussionControlService.currentDiscussionIdBean
  );
  const { data: isPaused, set: setIsPaused } = useBeanState(
    discussionControlService.isPausedBean
  );
  const status = isPaused ? "paused" : "active";

  const handleStatusChange = (status: Discussion["status"]) => {
    setIsPaused(status === "active");
  };

  // 处理第一条消息，设置为主题
  const handleMessage = async (content: string, agentId: string) => {
    const agentMessage = await addMessage(content, agentId);
    // 如果是第一条消息，设置为主题
    if (messages.length === 0) {
      discussionControlService.setTopic(content);
    }
    if (agentMessage) discussionControlService.onMessage(agentMessage);
  };

  useEffect(() => {
    if (messages.length > 0) {
      discussionControlService.setTopic((messages[0] as NormalMessage).content);
    }
    discussionControlService.setMessages(messages);
  }, [messages]);

  return (
    <div
      className={cn(rootClassName, "flex flex-col h-screen w-screen")}
      data-testid="app-root"
    >
      <Header
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        status={status}
      />

      <main className="flex-1 flex min-h-0" data-testid="app-main">
        {/* 左侧会话列表 */}
        <div
          className="w-80 flex-none border-r border-border bg-card"
          data-testid="discussion-list-container"
        >
          <div className="p-4 h-full">
            <DiscussionList />
          </div>
        </div>

        {/* 中间讨论区 */}
        <div
          className="flex-1 flex flex-col min-w-0"
          data-testid="discussion-area"
        >
          <div
            className="flex-none p-4 border-b"
            data-testid="discussion-controller"
          >
            <DiscussionController status={status} onSendMessage={addMessage} />
          </div>
          <div className="flex-1 min-h-0" data-testid="chat-area">
            <ChatArea
              key={currentDiscussionId}
              messages={messages}
              onSendMessage={handleMessage}
              getAgentName={getAgentName}
              getAgentAvatar={getAgentAvatar}
              onStartDiscussion={() => {
                if (status === "paused") {
                  handleStatusChange("active");
                }
              }}
            />
          </div>
        </div>

        {/* 右侧成员列表 */}
        <div
          className="w-80 flex-none border-l border-border bg-card"
          data-testid="member-list-container"
        >
          <div className="p-4 h-full">
            <MemberList />
          </div>
        </div>
      </main>
    </div>
  );
}
