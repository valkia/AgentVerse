import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Search, Settings, Sun, Moon, Users, PlusCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AgentList } from "@/components/agent/AgentList";
import { useAgents } from "@/hooks/useAgents";
import { useAgentForm } from "@/hooks/useAgentForm";
import { AgentForm } from "@/components/agent/AgentForm";

interface HeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  status: string;
}

export function Header({
  isDarkMode,
  toggleDarkMode,
  status
}: HeaderProps) {
  const [showAgentManager, setShowAgentManager] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const {
    agents,
    isLoading,
    addAgent,
    updateAgent,
    deleteAgent,
  } = useAgents();
  const {
    isFormOpen,
    setIsFormOpen,
    editingAgent,
    handleEditAgent,
    handleSubmit,
  } = useAgentForm(agents, updateAgent);

  const statusText = status === 'paused' ? '已暂停' : '讨论中';

  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.personality.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <>
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
                onClick={() => setShowAgentManager(true)}
                className="h-9 w-9"
              >
                <Users className="h-4 w-4" />
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

      <Dialog open={showAgentManager} onOpenChange={setShowAgentManager}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogTitle className="text-xl font-medium pb-2 border-b border-border/40">Agent 管理</DialogTitle>
          
          <div className="flex items-center gap-4 mt-6 px-1">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <Input
                placeholder="搜索 Agent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-muted/20 border-border/50 focus:bg-background/60"
              />
            </div>
            <Button
              onClick={addAgent}
              variant="default"
              size="sm"
              disabled={isLoading}
              className="h-9 px-4 shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <PlusCircle className="w-4 h-4 mr-2" />
              )}
              添加 Agent
            </Button>
          </div>
          <div className="mt-6 flex-1 min-h-0 overflow-y-auto pr-6 -mr-6">
            <div className="space-y-4 pb-6">
              <AgentList
                agents={filteredAgents}
                loading={isLoading}
                onEditAgent={handleEditAgent}
                onDeleteAgent={deleteAgent}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AgentForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
        initialData={editingAgent}
      />
    </>
  );
} 