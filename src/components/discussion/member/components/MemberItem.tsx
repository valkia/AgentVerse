import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAgents } from "@/hooks/useAgents";
import { useDiscussionMembers } from "@/hooks/useDiscussionMembers";
import { cn } from "@/lib/utils";
import { Agent } from "@/types/agent";
import { DiscussionMember } from "@/types/discussion-member";
import { Loader2, MoreVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface MemberItemProps {
  member: DiscussionMember;
  agent: Agent;
  onDelete?: () => void;
  onAutoReplyChange?: (isAutoReply: boolean) => void;
  className?: string;
}

export function MemberItem({
  member,
  agent,
  onDelete,
  onAutoReplyChange,
  className,
}: MemberItemProps) {
  const { getAgentName, getAgentAvatar } = useAgents();
  const { updateMember, removeMember } = useDiscussionMembers();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleAutoReplyChange = async (checked: boolean) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      await updateMember(member.id, { isAutoReply: checked });
      onAutoReplyChange?.(checked);
    } catch (error) {
      console.error("Error updating member:", error);
      toast({
        title: "更新失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      await removeMember(member.id);
      onDelete?.();
    } catch (error) {
      console.error("Error deleting member:", error);
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 group",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <img
          src={getAgentAvatar(agent.id)}
          alt={getAgentName(agent.id)}
          className="w-8 h-8 rounded-full"
        />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{getAgentName(agent.id)}</div>
          <div className="text-xs text-muted-foreground line-clamp-1">
            {agent.expertise.join("、")}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <Switch
            checked={member.isAutoReply}
            onCheckedChange={handleAutoReplyChange}
            disabled={isLoading}
          />
          <span className="text-xs text-muted-foreground">
            {member.isAutoReply ? "自动" : "手动"}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-red-600 focus:text-red-600"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              移除成员
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
} 