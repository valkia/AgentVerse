import { Agent } from "@/types/agent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  agents: Agent[];
  onSendMessage: (content: string, agentId: string) => Promise<void>;
  className?: string;
  isFirstMessage?: boolean;
  onStartDiscussion?: () => void;
}

export function MessageInput({ 
  agents, 
  onSendMessage, 
  className,
  isFirstMessage = false,
  onStartDiscussion
}: MessageInputProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(() => {
    // 如果是第一条消息，默认选择主持人
    if (isFirstMessage) {
      const moderator = agents.find(a => a.role === 'moderator');
      return moderator?.id || '';
    }
    // 否则默认选择参与者
    const participant = agents.find(a => a.role === 'participant');
    return participant?.id || agents[0]?.id || "";
  });
  
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  useEffect(() => {
    // 当选择了Agent时自动聚焦输入框
    if (selectedAgent && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedAgent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && selectedAgentId && !isLoading) {
      try {
        setIsLoading(true);
        await onSendMessage(input.trim(), selectedAgentId);
        // 如果是第一条消息，自动启动讨论
        if (isFirstMessage && onStartDiscussion) {
          onStartDiscussion();
        }
        setInput("");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + Enter 发送消息
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !isLoading) {
      handleSubmit(e);
    }
  };

  const canSubmit = selectedAgent && input.trim() && !isLoading;

  return (
    <div className={cn(className)}>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Select 
            value={selectedAgentId} 
            onValueChange={setSelectedAgentId} 
            disabled={isLoading || (isFirstMessage && selectedAgent?.role === 'moderator')}
          >
            <SelectTrigger className="w-[180px] h-9 text-sm">
              <SelectValue placeholder="选择发送消息的Agent" />
            </SelectTrigger>
            <SelectContent>
              {agents
                .filter(agent => !isFirstMessage || agent.role === 'moderator')
                .map((agent) => (
                <SelectItem
                  key={agent.id}
                  value={agent.id}
                  className="flex items-center"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={agent.avatar} />
                      <AvatarFallback className="text-xs">{agent.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{agent.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedAgent && (
            <Badge variant="outline" className="h-5 text-xs font-normal">
              {selectedAgent.role === "moderator" ? "主持人" : "参与者"}
            </Badge>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isFirstMessage
                ? "请输入讨论主题，主持人将开启讨论..."
                : selectedAgent
                  ? `以 ${selectedAgent.name} 的身份发送消息... (Cmd/Ctrl + Enter 发送)`
                  : "请先选择一个Agent..."
            }
            className="flex-1 h-9 text-sm"
            disabled={!selectedAgent || isLoading}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!canSubmit}
            className={cn(
              "transition-all px-2 h-9 min-w-[36px]",
              canSubmit
                ? "bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
                : "opacity-50 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
} 