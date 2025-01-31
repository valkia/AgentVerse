import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAgents } from "@/hooks/useAgents";
import { cn } from "@/lib/utils";
import { Loader2, Send } from "lucide-react";
import { useRef, useState } from "react";
import { useMemberSelection, Member } from "@/hooks/useMemberSelection";

interface MessageInputProps {
  onSendMessage: (content: string, agentId: string) => Promise<void>;
  className?: string;
  isFirstMessage?: boolean;
}

function AgentSelectItem({ agentId, memberId }: { agentId: string; memberId: string }) {
  const { getAgentName, getAgentAvatar } = useAgents();
  
  return (
    <SelectItem value={memberId} className="flex items-center">
      <div className="flex items-center gap-2">
        <Avatar className="w-5 h-5">
          <AvatarImage src={getAgentAvatar(agentId)} />
          <AvatarFallback className="text-xs">
            {getAgentName(agentId)[0]}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm">{getAgentName(agentId)}</span>
      </div>
    </SelectItem>
  );
}

export function MessageInput({
  onSendMessage,
  className,
  isFirstMessage = false,
}: MessageInputProps) {
  const { agents, getAgentName } = useAgents();
  const {
    selectedMemberId,
    setSelectedMemberId,
    selectedAgent,
    availableMembers,
    isSelectDisabled
  } = useMemberSelection(isFirstMessage);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setIsLoading(true);
      await onSendMessage(input.trim(), selectedMemberId);
      setInput("");
      inputRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = Boolean(selectedAgent && input.trim() && !isLoading);
  const inputPlaceholder = isFirstMessage
    ? "请输入讨论主题，主持人将开启讨论..."
    : selectedAgent
    ? `以 ${getAgentName(selectedAgent.id)} 的身份发送消息... (Cmd/Ctrl + Enter 发送)`
    : "请先选择一个Agent...";

  return (
    <div className={cn(className)}>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Select
            value={selectedMemberId}
            onValueChange={setSelectedMemberId}
            disabled={isLoading || isSelectDisabled}
          >
            <SelectTrigger className="w-[180px] h-9 text-sm">
              <SelectValue placeholder="选择发送消息的Agent" />
            </SelectTrigger>
            <SelectContent>
              {availableMembers.map((member: Member) => {
                const agent = agents.find(a => a.id === member.agentId);
                if (!agent) return null;
                return (
                  <AgentSelectItem 
                    key={member.agentId}
                    agentId={agent.id}
                    memberId={member.agentId}
                  />
                );
              })}
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
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                handleSubmit(e);
              }
            }}
            placeholder={inputPlaceholder}
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
