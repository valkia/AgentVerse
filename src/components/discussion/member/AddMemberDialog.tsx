import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAgents } from "@/hooks/useAgents";
import { useDiscussionMembers } from "@/hooks/useDiscussionMembers";
import { Agent } from "@/types/agent";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMemberDialog({ open, onOpenChange }: AddMemberDialogProps) {
  const { agents } = useAgents();
  const { members, addMember } = useDiscussionMembers();
  const { toast } = useToast();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 过滤掉已经是成员的智能体
  const availableAgents = agents.filter(
    (agent) => !members.some((member) => member.agentId === agent.id)
  );

  const handleSelect = async (agent: Agent) => {
    if (isLoading) return;
    setSelectedAgent(agent);
    setIsLoading(true);

    try {
      await addMember(agent.id);
      onOpenChange(false);
      toast({
        title: "添加成功",
        description: `${agent.name} 已加入讨论`,
      });
    } catch (error) {
      console.error("Error adding member:", error);
      toast({
        title: "添加失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setSelectedAgent(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>添加成员</DialogTitle>
          <DialogDescription>
            选择一个智能体加入当前讨论
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 mt-4">
          {availableAgents.map((agent) => {
            const isSelected = selectedAgent?.id === agent.id;
            const isAgentLoading = isSelected && isLoading;

            return (
              <Button
                key={agent.id}
                variant="outline"
                className={cn(
                  "h-auto py-3 px-4",
                  "flex items-start gap-3",
                  "hover:bg-muted/50",
                  isSelected && "border-primary"
                )}
                onClick={() => handleSelect(agent)}
                disabled={isAgentLoading}
              >
                <img
                  src={agent.avatar}
                  alt={agent.name}
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm flex items-center gap-2">
                    {agent.name}
                    {isAgentLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isSelected ? (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    ) : null}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {agent.expertise.join("、")}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
} 