import { Button } from "@/components/ui/button";
import { useAgents } from "@/hooks/useAgents";
import { cn } from "@/lib/utils";
import { Agent, AgentCombination } from "@/types/agent";
import { Loader2, Users, Crown, Plus } from "lucide-react";
import { useState } from "react";
import { AddMemberDialog } from "./add-member-dialog";
import { AGENT_COMBINATIONS, AgentCombinationType } from "@/config/agents";
import { useDiscussionMembers } from "@/hooks/useDiscussionMembers";
import { useMessages } from "@/hooks/useMessages";
import { useToast } from "@/hooks/use-toast";
import { ModeratorCard } from "./setup/moderator-card";
import { AgentCombinationCard } from "./setup/combination-card";

interface LoadingState {
  type: 'moderator' | 'combination' | 'skip' | null;
  id?: string;
}

interface DiscussionSetupPageProps {
  className?: string;
}

export function DiscussionSetupPage({ className }: DiscussionSetupPageProps) {
  const { agents } = useAgents();
  const { members } = useDiscussionMembers();
  const { messages } = useMessages();
  const { addMembers } = useDiscussionMembers();
  const { toast } = useToast();
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [loading, setLoading] = useState<LoadingState>({ type: null });

  // 如果已经有成员或消息，不显示设置页面
  if (members.length > 0 || messages.length > 0) {
    return null;
  }

  // 获取所有主持人（限制数量为4）
  const moderators = agents
    .filter(agent => agent.role === "moderator")
    .slice(0, 4);

  // 获取推荐组合（限制数量为4）
  const combinations: Record<AgentCombinationType, AgentCombination> = Object.entries(AGENT_COMBINATIONS)
    .slice(0, 4)
    .reduce((acc, [key, value]) => ({ 
      ...acc, 
      [key as AgentCombinationType]: value 
    }), {} as Record<AgentCombinationType, AgentCombination>);

  const handleError = (error: unknown) => {
    toast({
      title: "操作失败",
      description: error instanceof Error ? error.message : "未知错误",
      variant: "destructive",
    });
  };

  const handleSelectModerator = async (moderatorId: string) => {
    if (loading.type) return;
    setLoading({ type: 'moderator', id: moderatorId });
    
    try {
      await addMembers([{ agentId: moderatorId, isAutoReply: true }]);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading({ type: null });
    }
  };

  const handleSelectCombination = async (combinationId: AgentCombinationType) => {
    if (loading.type) return;
    setLoading({ type: 'combination', id: combinationId });

    try {
      const combination = combinations[combinationId];
      if (!combination) return;

      const moderator = agents.find(a => a.name === combination.moderator.name);
      const participants = combination.participants
        .map(p => agents.find(a => a.name === p.name))
        .filter((agent): agent is Agent => Boolean(agent));

      if (moderator) {
        const membersToAdd = [
          { agentId: moderator.id, isAutoReply: true },
          ...participants.map(participant => ({ 
            agentId: participant.id, 
            isAutoReply: false 
          }))
        ];
        await addMembers(membersToAdd);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading({ type: null });
    }
  };

  const handleCustomSelect = () => {
    setShowAddMemberDialog(true);
  };

  const handleSkip = async () => {
    if (loading.type) return;
    setLoading({ type: 'skip' });
    try {
      await addMembers([]);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading({ type: null });
    }
  };

  return (
    <div className={cn("h-full flex flex-col", className)}>
      <div className="flex-none text-center py-4">
        <h2 className="text-xl font-semibold tracking-tight">开始一场新的讨论</h2>
        <p className="text-sm text-muted-foreground mt-1">
          选择初始成员组合开始，随时可以调整成员构成
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-2xl space-y-6">
          {/* 选择主持人 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Crown className="w-4 h-4" />
                选择主持人开始
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground h-7 px-2"
                onClick={handleCustomSelect}
                disabled={loading.type !== null}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                自由选择
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {moderators.map((moderator) => (
                <ModeratorCard
                  key={moderator.id}
                  agent={moderator}
                  isSelected={loading.type === 'moderator' && loading.id === moderator.id}
                  onClick={() => handleSelectModerator(moderator.id)}
                />
              ))}
            </div>
          </div>

          {/* 分隔或 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                或者
              </span>
            </div>
          </div>

          {/* 推荐组合 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="w-4 h-4" />
              选择推荐组合
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(combinations).map(([id, combination]) => {
                const moderator = agents.find(a => a.name === combination.moderator.name);
                const participants = combination.participants
                  .map(p => agents.find(a => a.name === p.name))
                  .filter((agent): agent is Agent => Boolean(agent));

                if (!moderator) return null;

                return (
                  <AgentCombinationCard
                    key={id}
                    name={combination.name}
                    description={combination.description}
                    moderator={moderator}
                    participants={participants}
                    isSelected={loading.type === 'combination' && loading.id === id}
                    onClick={() => handleSelectCombination(id as AgentCombinationType)}
                    isLoading={loading.type === 'combination' && loading.id === id}
                  />
                );
              })}
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="text-center">
            <Button
              variant="link"
              size="sm"
              className="text-xs text-muted-foreground h-7"
              onClick={handleSkip}
              disabled={loading.type !== null}
            >
              {loading.type === 'skip' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
              ) : null}
              暂不选择，直接开始
            </Button>
          </div>
        </div>
      </div>

      <AddMemberDialog
        open={showAddMemberDialog}
        onOpenChange={setShowAddMemberDialog}
      />
    </div>
  );
} 