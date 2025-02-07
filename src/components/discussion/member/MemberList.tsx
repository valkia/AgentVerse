import { Button } from "@/components/ui/button";
import { useAgents } from "@/hooks/useAgents";
import { useDiscussionMembers } from "@/hooks/useDiscussionMembers";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AddMemberDialog } from "./AddMemberDialog";
import { MemberItem } from "./components/MemberItem";
import { MemberSkeleton } from "./components/MemberSkeleton";

interface MemberListProps {
  className?: string;
  headerClassName?: string;
  listClassName?: string;
}

export function MemberList({
  className,
  headerClassName,
  listClassName,
}: MemberListProps) {
  const { agents } = useAgents();
  const { members, isLoading } = useDiscussionMembers();
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);

  return (
    <div className={cn("flex flex-col flex-1 overflow-hidden h-full", className)}>
      <header
        className={cn(
          "flex-none flex justify-between items-center mb-3 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 z-10 py-2",
          headerClassName
        )}
      >
        <h2 className="text-lg font-medium">成员列表</h2>
        <Button
          onClick={() => setShowAddMemberDialog(true)}
          variant="outline"
          size="sm"
          className="h-8 px-3 hover:bg-muted/50"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          添加成员
        </Button>
      </header>

      <div
        className={cn(
          "flex-1 min-h-0 overflow-y-auto",
          listClassName
        )}
      >
        <div className="space-y-4 pb-4">
          {isLoading ? (
            <div className="space-y-4">
              <MemberSkeleton />
              <MemberSkeleton />
              <MemberSkeleton />
            </div>
          ) : (
            members.map((member) => {
              const agent = agents.find((a) => a.id === member.agentId);
              if (!agent) return null;
              return (
                <MemberItem
                  key={member.id}
                  member={member}
                  agent={agent}
                />
              );
            })
          )}
        </div>
      </div>

      <AddMemberDialog
        open={showAddMemberDialog}
        onOpenChange={setShowAddMemberDialog}
      />
    </div>
  );
} 