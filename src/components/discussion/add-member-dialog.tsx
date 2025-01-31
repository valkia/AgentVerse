import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAgents } from "@/hooks/useAgents";
import { useDiscussionMembers } from "@/hooks/useDiscussionMembers";
import { cn } from "@/lib/utils";
import { Agent } from "@/types/agent";
import { Check } from "lucide-react";
import { useState } from "react";

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMemberDialog({ open, onOpenChange }: AddMemberDialogProps) {
  const { agents, getAgentName, getAgentAvatar } = useAgents();
  const { members, addMember } = useDiscussionMembers();
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());

  // 过滤掉已经在讨论中的 agents
  const availableAgents = agents.filter(
    (agent) => !members.some((member) => member.agentId === agent.id)
  );

  const handleAgentClick = (agent: Agent) => {
    const newSelected = new Set(selectedAgents);
    if (selectedAgents.has(agent.id)) {
      newSelected.delete(agent.id);
    } else {
      newSelected.add(agent.id);
    }
    setSelectedAgents(newSelected);
  };

  const handleConfirm = async () => {
    // 添加选中的成员
    await Promise.all(
      Array.from(selectedAgents).map((agentId) =>
        addMember(agentId, true) // 默认开启自动回复
      )
    );
    onOpenChange(false);
    setSelectedAgents(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>添加讨论成员</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto">
          {availableAgents.map((agent) => (
            <div
              key={agent.id}
              className={cn(
                "p-4 rounded-lg border cursor-pointer transition-colors",
                selectedAgents.has(agent.id)
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/50"
              )}
              onClick={() => handleAgentClick(agent)}
            >
              <div className="flex items-center gap-3">
                <img
                  src={getAgentAvatar(agent.id)}
                  alt={getAgentName(agent.id)}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium truncate">
                      {getAgentName(agent.id)}
                    </h3>
                    <span className="text-xs text-muted-foreground capitalize">
                      {agent.role}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {agent.personality}
                  </p>
                </div>
                {selectedAgents.has(agent.id) && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSelectedAgents(new Set());
            }}
          >
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedAgents.size === 0}
          >
            添加
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 