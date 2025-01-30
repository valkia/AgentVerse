import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDiscussionMembers } from "@/hooks/useDiscussionMembers";
import { useAgents } from "@/hooks/useAgents";
import { cn } from "@/lib/utils";
import { PlusCircle, Loader2, UserX, Power } from "lucide-react";
import { useState } from "react";
import { AddMemberDialog } from "./AddMemberDialog";

interface MemberListProps {
  className?: string;
  headerClassName?: string;
  listClassName?: string;
}

export function MemberList({
  className,
  headerClassName,
  listClassName
}: MemberListProps) {
  const { members, isLoading, removeMember, toggleAutoReply } = useDiscussionMembers();
  const { agents } = useAgents();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const memberCount = members.length;

  return (
    <div className={cn("flex flex-col flex-1 overflow-hidden", className)}>
      <header
        className={cn(
          "flex-none flex justify-between items-center mb-3 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 z-10 py-2",
          headerClassName
        )}
      >
        <div>
          <h2 className="text-lg font-medium">讨论成员</h2>
          <p className="text-sm text-muted-foreground mt-0.5">共 {memberCount} 位成员</p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="h-8 px-3 hover:bg-muted/50"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
          )}
          添加成员
        </Button>
      </header>

      <div
        className={cn(
          "flex-1 min-h-0 overflow-y-auto",
          listClassName
        )}
      >
        <div className="space-y-2 pb-4">
          {members.map((member) => {
            const agent = agents.find(a => a.id === member.agentId);
            if (!agent) return null;

            return (
              <Card
                key={member.id}
                className="p-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex gap-3">
                  <img
                    src={agent.avatar}
                    alt={agent.name}
                    className="w-9 h-9 rounded-full bg-muted/30 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="font-medium text-base leading-none">
                        {agent.name}
                      </h3>
                      <div className="flex items-center gap-0.5 shrink-0 ml-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleAutoReply(member.id)}
                          className={cn(
                            "h-6 w-6 hover:bg-muted/50",
                            member.isAutoReply && "text-primary bg-primary/10 hover:bg-primary/20"
                          )}
                          title={member.isAutoReply ? "关闭自动回复" : "开启自动回复"}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMember(member.id)}
                          className="h-6 w-6 hover:bg-red-500/10 text-red-500/70 hover:text-red-500"
                          title="移除成员"
                        >
                          <UserX className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-muted-foreground/70 capitalize shrink-0 px-2 py-0.5 rounded-full bg-muted/30">
                        {agent.role}
                      </span>
                      <p className="text-sm text-muted-foreground/80 truncate">
                        {agent.personality}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <Loader2 className="w-7 h-7 animate-spin text-primary/70" />
          </div>
        )}
        {!isLoading && members.length === 0 && (
          <div className="text-center py-8 text-muted-foreground/70">
            暂无成员，点击上方按钮添加
          </div>
        )}
      </div>

      <AddMemberDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </div>
  );
} 
