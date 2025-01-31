import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Agent } from "@/types/agent";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface AgentCardProps {
  agent: Agent;
  onEdit: (agent: Agent) => void;
  onDelete: (agentId: string) => void;
  className?: string;
}

interface AgentInfoProps {
  agent: Agent;
  isExpanded: boolean;
}

function AgentInfo({ agent, isExpanded }: AgentInfoProps) {
  return (
    <div className="flex items-center space-x-3">
      <Avatar className="w-10 h-10 border-2 border-purple-500/20">
        <AvatarImage src={agent.avatar} alt={agent.name} />
        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white">
          {agent.name[0]}
        </AvatarFallback>
      </Avatar>
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-base font-medium">{agent.name}</span>
          <Badge
            variant={agent.role === "moderator" ? "default" : "secondary"}
            className="text-xs px-1.5 py-0"
          >
            {agent.role === "moderator" ? "主持人" : "参与者"}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
          <span>{agent.personality}</span>
          {!isExpanded && agent.expertise.length > 0 && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              {agent.expertise[0]}
              {agent.expertise.length > 1
                ? ` +${agent.expertise.length - 1}`
                : ""}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

interface AgentActionsProps {
  agent: Agent;
  onEdit: (agent: Agent) => void;
  onDelete: (agentId: string) => void;
  onAutoReplyChange?: (agentId: string, isAutoReply: boolean) => void;
  isExpanded: boolean;
  onExpandToggle: () => void;
}

function AgentActions({
  agent,
  onEdit,
  onDelete,
  isExpanded,
  onExpandToggle,
}: AgentActionsProps) {
  return (
    <div className="flex items-center justify-between gap-2 mt-3">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(agent)}
          className="h-8 px-2 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950 dark:hover:text-purple-400"
        >
          编辑
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(agent.id)}
          className="h-8 px-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
        >
          删除
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onExpandToggle}
          className="h-8 w-8 p-0"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

interface AgentDetailsProps {
  agent: Agent;
  isExpanded: boolean;
}

function AgentDetails({ agent, isExpanded }: AgentDetailsProps) {
  if (!isExpanded) return null;

  return (
    <div className="mt-3 pt-3 space-y-3 border-t dark:border-gray-700">
      {agent.expertise.length > 0 && (
        <div>
          <Label className="text-sm mb-1.5 block">专业领域</Label>
          <div className="flex flex-wrap gap-1.5">
            {agent.expertise.map((expertise) => (
              <Badge
                key={expertise}
                variant="outline"
                className="text-xs px-1.5 py-0"
              >
                {expertise}
              </Badge>
            ))}
          </div>
        </div>
      )}
      <div>
        <Label className="text-sm mb-1 block">偏好倾向</Label>
        <p className="text-sm text-muted-foreground">{agent.bias}</p>
      </div>
      <div>
        <Label className="text-sm mb-1 block">回复风格</Label>
        <p className="text-sm text-muted-foreground">{agent.responseStyle}</p>
      </div>
      <div>
        <Label className="text-sm mb-1 block">Prompt</Label>
        <p className="text-sm text-muted-foreground whitespace-pre-line">
          {agent.prompt}
        </p>
      </div>
    </div>
  );
}

export function AgentCard({
  agent,
  onEdit,
  onDelete,
  className,
}: AgentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card
      className={cn(
        "w-full hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors",
        className
      )}
    >
      <CardHeader className="p-4 space-y-0">
        <AgentInfo agent={agent} isExpanded={isExpanded} />
        <AgentActions
          agent={agent}
          onEdit={onEdit}
          onDelete={onDelete}
          isExpanded={isExpanded}
          onExpandToggle={() => setIsExpanded(!isExpanded)}
        />
        <AgentDetails agent={agent} isExpanded={isExpanded} />
      </CardHeader>
    </Card>
  );
}
