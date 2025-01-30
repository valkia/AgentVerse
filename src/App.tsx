import { ChatArea } from "@/components/chat/ChatArea";
import { DiscussionController } from "@/components/discussion/DiscussionController";
import { DiscussionList } from "@/components/discussion/DiscussionList";
import { MemberList } from "@/components/discussion/MemberList";
import { Header } from "@/components/layout/Header";
import { useAgents } from "@/hooks/useAgents";
import { useDiscussion } from "@/hooks/useDiscussion";
import { useMessages } from "@/hooks/useMessages";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function App() {
  const { isDarkMode, toggleDarkMode, rootClassName } = useTheme();
  const {
    agents,
    getAgentName,
    getAgentAvatar,
  } = useAgents();
  const { status, setStatus } = useDiscussion();
  const { messages, addMessage } = useMessages();

  // 添加主题状态管理
  const [topic, setTopic] = useState<string>();

  // 处理第一条消息，设置为主题
  const handleMessage = async (content: string, agentId: string) => {
    await addMessage(content, agentId);
    // 如果是第一条消息，设置为主题
    if (messages.length === 0) {
      setTopic(content);
    }
  };

  return (
    <div className={cn(rootClassName, "flex flex-col h-screen w-screen")} data-testid="app-root">
      <Header 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode}
        status={status}
      />
      
      <main className="flex-1 flex min-h-0" data-testid="app-main">
        {/* 左侧会话列表 */}
        <div className="w-80 flex-none border-r border-border bg-card" data-testid="discussion-list-container">
          <div className="p-4 h-full">
            <DiscussionList />
          </div>
        </div>

        {/* 中间讨论区 */}
        <div className="flex-1 flex flex-col min-w-0" data-testid="discussion-area">
          <div className="flex-none p-4 border-b" data-testid="discussion-controller">
            <DiscussionController
              topic={topic}
              status={status}
              onStatusChange={setStatus}
              onSendMessage={addMessage}
            />
          </div>
          <div className="flex-1 min-h-0" data-testid="chat-area">
            <ChatArea
              messages={messages}
              agents={agents}
              onSendMessage={handleMessage}
              getAgentName={getAgentName}
              getAgentAvatar={getAgentAvatar}
              onStartDiscussion={() => {
                if (status === 'paused') {
                  setStatus('active');
                }
              }}
            />
          </div>
        </div>

        {/* 右侧成员列表 */}
        <div className="w-80 flex-none border-l border-border bg-card" data-testid="member-list-container">
          <div className="p-4 h-full">
            <MemberList />
          </div>
        </div>
      </main>
    </div>
  );
}
