import { AgentForm } from "@/components/agent/AgentForm";
import { AgentList } from "@/components/agent/AgentList";
import { ChatArea } from "@/components/chat/ChatArea";
import { DiscussionController } from "@/components/discussion/DiscussionController";
import { Button } from "@/components/ui/button";
import { useAgentForm } from "@/hooks/useAgentForm";
import { useAgents } from "@/hooks/useAgents";
import { useDiscussion } from "@/hooks/useDiscussion";
import { useMessages } from "@/hooks/useMessages";
import { useTheme } from "@/hooks/useTheme";
import { Search, Settings, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

function Header({
  isDarkMode,
  toggleDarkMode,
  status
}: {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  status: string;
}) {
  const statusText = status === 'paused' ? '已暂停' : '讨论中';
  
  return (
    <header className="flex-none py-3 px-4 border-b dark:border-gray-800">
      <div className="container mx-auto max-w-[1920px] flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 text-transparent bg-clip-text">
          多Agent讨论系统
        </h1>

        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm px-2 py-1 rounded-md",
            status === 'paused' 
              ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              : "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400"
          )}>
            {statusText}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="h-9 w-9"
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

export function App() {
  const { isDarkMode, toggleDarkMode, rootClassName } = useTheme();
  const {
    agents,
    loading,
    addAgent,
    updateAgent,
    deleteAgent,
    toggleAutoReply,
    getAgentName,
    getAgentAvatar,
  } = useAgents();
  const { status, setStatus, settings, setSettings } = useDiscussion();
  const { messages, addMessage } = useMessages();
  const {
    isFormOpen,
    setIsFormOpen,
    editingAgent,
    handleEditAgent,
    handleSubmit,
  } = useAgentForm(agents, updateAgent);

  return (
    <div className={cn(rootClassName, "flex flex-col h-screen")}>
      <Header 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode}
        status={status}
      />

      <main className="flex-1 container mx-auto max-w-[1920px] p-4 min-h-0 flex flex-col">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
          {/* 左侧成员管理区 */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col min-h-0">
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex flex-col min-h-0 p-6">
              <AgentList
                agents={agents}
                loading={loading}
                onAddAgent={addAgent}
                onEditAgent={handleEditAgent}
                onDeleteAgent={deleteAgent}
                onAutoReplyChange={toggleAutoReply}
              />
            </div>
          </div>

          {/* 右侧讨论区 */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col min-h-0 order-last lg:order-first">
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex flex-col min-h-0">
              <div className="flex-none p-6 border-b dark:border-gray-700">
                <DiscussionController
                  agents={agents}
                  status={status}
                  settings={settings}
                  onStatusChange={setStatus}
                  onSettingsChange={setSettings}
                  onSendMessage={addMessage}
                />
              </div>
              <ChatArea
                messages={messages}
                agents={agents}
                onSendMessage={addMessage}
                getAgentName={getAgentName}
                getAgentAvatar={getAgentAvatar}
                className="flex-1 min-h-0"
              />
            </div>
          </div>
        </div>
      </main>

      <AgentForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
        initialData={editingAgent}
      />
    </div>
  );
}
