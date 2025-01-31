import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Agent } from "@/types/agent";
import { DiscussionMember } from "@/types/discussion-member";
import { ChevronRight, UserX } from "lucide-react";

interface MemberItemProps {
  member: DiscussionMember;
  agent: Agent;
  isExpanded: boolean;
  onExpand: () => void;
  onToggleAutoReply: () => void;
  onRemove: (e: React.MouseEvent) => void;
  className?: string;
}

export function MemberItem({
  member,
  agent,
  isExpanded,
  onExpand,
  onToggleAutoReply,
  onRemove,
  className,
  ...props
}: MemberItemProps) {
  return (
    <Card
      className={cn(
        "transition-all duration-200 cursor-pointer group overflow-hidden outline-none bg-white",
        isExpanded ? "shadow-sm" : "hover:shadow-sm",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "rounded-xl",
        className
      )}
      onClick={onExpand}
      {...props}
    >
      <div className="p-4">
        <div className="flex gap-4">
          <img
            src={agent.avatar}
            alt={agent.name}
            className="w-10 h-10 rounded-xl bg-muted/30 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <h3 className="font-medium text-base truncate">
                    {agent.name}
                  </h3>
                </div>
                <ChevronRight 
                  className={cn(
                    "w-4 h-4 text-muted-foreground/40 transition-transform duration-200 shrink-0",
                    isExpanded && "rotate-90"
                  )} 
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {agent.role}
                </span>
                <div 
                  className="flex items-center gap-2" 
                  onClick={e => e.stopPropagation()}
                >
                  <span className="text-sm text-muted-foreground">自动回复</span>
                  <Switch
                    checked={member.isAutoReply}
                    onCheckedChange={onToggleAutoReply}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div 
        className={cn(
          "grid transition-all duration-200",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 border-t bg-muted/5 space-y-3">
            <p className="text-sm text-muted-foreground pt-3">
              {agent.personality}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground/70">
                {new Date(member.joinedAt).toLocaleString('zh-CN', { 
                  month: 'numeric',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric'
                })} 加入
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="h-7 px-2 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
              >
                <UserX className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
} 