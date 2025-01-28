import { Agent } from "@/types/agent";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface AgentCardProps {
  agent: Agent;
  onEdit: (agent: Agent) => void;
  onDelete: (agentId: string) => void;
  onAutoReplyChange?: (agentId: string, isAutoReply: boolean) => void;
}

export function AgentCard({ agent, onEdit, onDelete, onAutoReplyChange }: AgentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="w-12 h-12 border-2 border-purple-500/20">
              <AvatarImage src={agent.avatar} alt={agent.name} />
              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white">
                {agent.name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">{agent.name}</span>
                <Badge variant={agent.role === "moderator" ? "default" : "secondary"}>
                  {agent.role === "moderator" ? "主持人" : "参与者"}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span>{agent.personality}</span>
                {!isExpanded && agent.expertise.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {agent.expertise[0]}{agent.expertise.length > 1 ? ` +${agent.expertise.length - 1}` : ''}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(agent)}
              className={cn(
                "transition-colors",
                "hover:bg-purple-50 hover:text-purple-600",
                "dark:hover:bg-purple-950 dark:hover:text-purple-400"
              )}
            >
              编辑
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(agent.id)}
              className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
            >
              删除
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {onAutoReplyChange && (
            <div className="flex items-center gap-2">
              <Switch
                id={`auto-reply-${agent.id}`}
                checked={agent.isAutoReply}
                onCheckedChange={(checked) => onAutoReplyChange(agent.id, checked)}
              />
              <Label htmlFor={`auto-reply-${agent.id}`} className="text-sm text-muted-foreground cursor-pointer">
                自动回复
              </Label>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-auto"
          >
            {isExpanded ? "收起" : "展开"}
            {isExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-1">专业领域</h4>
              <div className="flex flex-wrap gap-1">
                {agent.expertise.map((exp, index) => (
                  <Badge key={index} variant="outline">
                    {exp}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold mb-1">倾向性</h4>
              <p className="text-sm text-muted-foreground">{agent.bias}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-1">回复风格</h4>
              <p className="text-sm text-muted-foreground">{agent.responseStyle}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-1">Prompt</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{agent.prompt}</p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

