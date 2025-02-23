import { ChatArea } from "@/components/chat/chat-area";
import { ThemeProvider, useTheme } from "@/components/common/theme";
import { DiscussionController } from "@/components/discussion/control/discussion-controller";
import { DiscussionList } from "@/components/discussion/list/discussion-list";
import { MemberList } from "@/components/discussion/member/member-list";
import { ActivityBar } from "@/components/layout/activity-bar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { ResponsiveContainer } from "@/components/layout/responsive-container";
import { useSettingsDialog } from "@/components/settings/settings-dialog";
import { ModalProvider } from "@/components/ui/modal";
import { useBreakpointContext } from "@/contexts/breakpoint-context";
import { useAgents } from "@/hooks/useAgents";
import { useDiscussionMembers } from "@/hooks/useDiscussionMembers";
import { useDiscussions } from "@/hooks/useDiscussions";
import { useMessages } from "@/hooks/useMessages";
import { useViewportHeight } from "@/hooks/useViewportHeight";
import { cn } from "@/lib/utils";
import { discussionControlService } from "@/services/discussion-control.service";
import { Discussion, NormalMessage } from "@/types/discussion";
import React, { useEffect, useState } from "react";
import { useBeanState } from "rx-nested-bean";
import { DiscussionSetupPage } from "./components/discussion/setup/discussion-setup-page";
import { usePersistedState } from "@/hooks/usePersistedState";
import { UI_PERSIST_KEYS } from "@/config/ui-persist";

// 动态导入非首屏组件
const MobileMemberDrawer = React.lazy(() =>
  import("@/components/discussion/member/mobile-member-drawer").then(
    (module) => ({ default: module.MobileMemberDrawer })
  )
);

function AppContent() {
  const { isDesktop, isMobile } = useBreakpointContext();
  const { rootClassName } = useTheme();
  const { getAgentName, getAgentAvatar } = useAgents();
  const { messages, addMessage } = useMessages();
  const { members } = useDiscussionMembers();
  const { currentDiscussion, clearMessages } = useDiscussions();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showMembersForDesktop, setShowMembersForDesktop] = usePersistedState(
    false,
    {
      key: UI_PERSIST_KEYS.DISCUSSION.MEMBER_PANEL_VISIBLE,
      version: 1,
    }
  );
  const showDesktopMembers = isDesktop && showMembersForDesktop;
  const [showMobileMembers, setShowMobileMembers] = useState(false);
  const { data: currentDiscussionId } = useBeanState(
    discussionControlService.currentDiscussionIdBean
  );
  const { data: isPaused, set: setIsPaused } = useBeanState(
    discussionControlService.isPausedBean
  );
  const status = isPaused ? "paused" : "active";
  const { height } = useViewportHeight();
  const { openSettingsDialog } = useSettingsDialog();

  const handleStatusChange = (status: Discussion["status"]) => {
    setIsPaused(status === "paused");
  };

  const handleToggleMembers = () => {
    if (!isMobile) {
      setShowMembersForDesktop(!showMembersForDesktop);
    } else {
      setShowMobileMembers(true);
    }
  };

  // 处理第一条消息，设置为主题
  const handleMessage = async (content: string, agentId: string) => {
    const agentMessage = await addMessage({
      content,
      agentId,
      type: "text",
    });
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

  const handleSelectDiscussion = () => {
    if (!isDesktop) {
      setShowMobileSidebar(false);
    }
  };

  // 侧边栏内容
  const sidebarContent = (
    <div className="h-full bg-card">
      <DiscussionList onSelectDiscussion={handleSelectDiscussion} />
    </div>
  );

  // 主要内容
  const mainContent = (
    <div className="flex flex-col h-full">
      <MobileHeader
        onToggleSidebar={() => setShowMobileSidebar(true)}
        className="lg:hidden flex-none"
        title={currentDiscussion?.title || "讨论系统"}
        status={status}
        onStatusChange={handleStatusChange}
        onManageMembers={handleToggleMembers}
        onOpenSettings={() => {
          openSettingsDialog();
        }}
        onClearMessages={() => {
          if (currentDiscussion) {
            clearMessages(currentDiscussion.id);
          }
        }}
      />

      <div className="flex-1 flex min-h-0">
        {members.length === 0 ? (
          <div className="flex-1">
            <DiscussionSetupPage />
          </div>
        ) : (
          <>
            <div className="flex-1 flex flex-col min-w-0">
              {/* 只在PC端显示DiscussionController */}
              <div className="hidden lg:block">
                <DiscussionController
                  status={status}
                  onSendMessage={addMessage}
                  onToggleMembers={handleToggleMembers}
                  enableSettings={false}
                />
              </div>
              <div className="flex-1 min-h-0">
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

            <div
              className={cn(
                "w-80 flex-none border-l border-border bg-card hidden lg:block",
                !showDesktopMembers && "lg:hidden"
              )}
            >
              <div className="p-4 h-full">
                <MemberList />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 flex flex-col" style={{ height }}>
      <div className={cn(rootClassName, "flex flex-col h-full")}>
        <div className="flex-1 min-h-0 flex">
          {/* ActivityBar */}
          <ActivityBar className="hidden lg:flex" />

          {/* 主要内容区域 */}
          <div className="flex-1 flex justify-center w-full">
            <div className="w-full max-w-[1600px]">
              <ResponsiveContainer
                sidebarContent={sidebarContent}
                mainContent={mainContent}
                showMobileSidebar={showMobileSidebar}
                onMobileSidebarChange={setShowMobileSidebar}
              />
            </div>
          </div>
        </div>

        {/* 移动端成员管理抽屉 */}
        <React.Suspense>
          <MobileMemberDrawer
            open={showMobileMembers}
            onOpenChange={setShowMobileMembers}
          />
        </React.Suspense>
      </div>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <ModalProvider>
        <AppContent />
      </ModalProvider>
    </ThemeProvider>
  );
}
