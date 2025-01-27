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
}

export function AgentList({
  agents,
  onAddAgent,
  onEditAgent,
  onDeleteAgent,
  onAutoReplyChange,
  className
}: AgentListProps) {
  return (
    <div className={cn("flex flex-col flex-1", className)}>
      <header className="flex-none flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-foreground">讨论成员</h2>
        <Button onClick={onAddAgent} variant="secondary">
          <PlusCircle className="w-4 h-4 mr-2" />
          添加成员
        </Button>
      </header>

      <div className="relative flex-1 min-h-0">
        <div 
          className={cn(
            "absolute inset-0",
            "overflow-y-auto scrollbar-thin",
            "bg-background/50",
            "rounded-md"
          )}
        >
          <div className="space-y-3 p-0.5">
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
        
        <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-background to-transparent z-10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent z-10" />
      </div>
    </div>
  );
} 