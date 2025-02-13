import { AgentForm } from "@/components/agent/agent-form";
import { AgentList } from "@/components/agent/agent-list";
import { Button } from "@/components/ui/button"; // 根据您的 UI 组件库调整
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"; // 根据您的 UI 组件库调整
import { Input } from "@/components/ui/input";
import { useAgentForm } from "@/hooks/useAgentForm";
import { useAgents } from "@/hooks/useAgents";
import { Loader2, PlusCircle, Search } from "lucide-react";
import match from "pinyin-match"; // 添加 pinyin-match
import React, { useMemo, useState } from "react"; // 添加 useMemo

interface AddAgentDialogProps {
  isOpen: boolean;
  onOpenChange: (visible: boolean) => void;
}

export const AddAgentDialog: React.FC<AddAgentDialogProps> = ({
  isOpen,
  onOpenChange,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { agents, isLoading, addAgent, updateAgent, deleteAgent } = useAgents();
  const {
    isFormOpen,
    setIsFormOpen,
    editingAgent,
    handleEditAgent,
    handleSubmit,
  } = useAgentForm(agents, updateAgent);

  // 使用 useMemo 优化搜索过滤逻辑
  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) {
      return agents;
    }

    const query = searchQuery.toLowerCase();
    return agents.filter((agent) => {
      // 支持名称、个性和拼音匹配
      const nameMatch =
        agent.name.toLowerCase().includes(query) ||
        match.match(agent.name, query);
      const personalityMatch =
        agent.personality.toLowerCase().includes(query) ||
        match.match(agent.personality, query);

      return nameMatch || personalityMatch;
    });
  }, [agents, searchQuery]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogTitle className="text-xl font-medium pb-2 border-b border-border/40">
            Agent 管理
          </DialogTitle>

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
};
