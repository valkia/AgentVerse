import { Agent } from "@/types/agent";
import { AgentCard } from "./AgentCard";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentListProps {
  agents: Agent[];
  onAddAgent: () => void;
  onEditAgent: (agent: Agent) => void;
  onDeleteAgent: (agentId: string) => void;
  onAutoReplyChange?: (agentId: string, isAutoReply: boolean) => void;
  className?: string;
  headerClassName?: string;
  listClassName?: string;
}

export function AgentList({
  agents,
  onAddAgent,
  onEditAgent,
  onDeleteAgent,
  onAutoReplyChange,
  className,
  headerClassName,
  listClassName
}: AgentListProps) {
  return (
    <div className={cn("flex flex-col flex-1 overflow-hidden", className)}>
      <header className={cn(
        "flex-none flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-gray-800 z-10",
        headerClassName
      )}>
        <h2 className="text-xl font-semibold text-foreground">讨论成员</h2>
        <Button onClick={onAddAgent} variant="secondary" size="sm">
          <PlusCircle className="w-4 h-4 mr-1.5" />
          添加成员
        </Button>
      </header>

      <div className={cn(
        "flex-1 min-h-0 overflow-y-auto -mx-2 px-2",
        listClassName
      )}>
        <div className="space-y-2.5 pb-4">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={onEditAgent}
              onDelete={onDeleteAgent}
              onAutoReplyChange={onAutoReplyChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 