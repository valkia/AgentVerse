import { Button } from "@/components/ui/button";
import { AGENT_COMBINATIONS, AgentCombinationType } from "@/config/agents";
import { useAgents } from "@/hooks/useAgents";
import { useDiscussionMembers } from "@/hooks/useDiscussionMembers";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface QuickMemberSelectorProps {
  onSelect?: () => void;
}

export function QuickMemberSelector({ onSelect }: QuickMemberSelectorProps) {
  const { agents } = useAgents();
  const { addMembers } = useDiscussionMembers();
  const { toast } = useToast();
  const [loading, setLoading] = useState<AgentCombinationType | null>(null);

  const handleSelect = async (type: AgentCombinationType) => {
    if (loading) return;
    setLoading(type);

    try {
      const combination = AGENT_COMBINATIONS[type];
      if (!combination) return;

      // 查找主持人和参与者
      const moderatorAgent = agents.find(
        a => a.role === "moderator" && a.name === combination.moderator.name
      );
      const participantAgents = combination.participants
        .map(p => agents.find(a => a.role === "participant" && a.name === p.name))
        .filter(Boolean);

      // 准备所有要添加的成员
      const membersToAdd = [];
      
      if (moderatorAgent) {
        console.log('Adding moderator:', moderatorAgent.name);
        membersToAdd.push({ agentId: moderatorAgent.id, isAutoReply: true });
      }

      participantAgents.forEach(agent => {
        if (agent) {
          console.log('Adding participant:', agent.name);
          membersToAdd.push({ agentId: agent.id, isAutoReply: true });
        }
      });

      if (membersToAdd.length === 0) {
        throw new Error('没有找到可添加的成员');
      }

      // 批量添加所有成员
      await addMembers(membersToAdd);
      console.log('All members added successfully');
      onSelect?.();
    } catch (error) {
      console.error('Error adding members:', error);
      toast?.({
        title: "添加成员失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-2 px-4">
      {Object.entries(AGENT_COMBINATIONS).map(([type, { name, description }]) => {
        const isLoading = loading === type;
        return (
          <Button
            key={type}
            variant="outline"
            className={cn(
              "w-full h-auto py-3 px-4 flex flex-col items-start gap-1",
              "hover:bg-muted/50",
              isLoading && "pointer-events-none"
            )}
            onClick={() => handleSelect(type as AgentCombinationType)}
            disabled={isLoading}
          >
            <div className="flex items-center gap-2">
              <div className="font-medium">{name}</div>
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            </div>
            <div className="text-xs text-muted-foreground text-left line-clamp-2 w-full">
              {description}
            </div>
          </Button>
        );
      })}
    </div>
  );
} 