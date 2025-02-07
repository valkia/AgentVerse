import { Button } from "@/components/ui/button";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import { useAgents } from "@/hooks/useAgents";
import { useMemberSelection } from "@/hooks/useMemberSelection";
import { cn } from "@/lib/utils";
import { Loader2, Send } from "lucide-react";
import { useRef, useState } from "react";
import { MemberSelector } from "./member-selector";

interface MessageInputProps {
  onSendMessage: (content: string, agentId: string) => Promise<void>;
  className?: string;
  isFirstMessage?: boolean;
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
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setIsLoading(true);
      await onSendMessage(input.trim(), selectedMemberId === 'self' ? 'user' : selectedAgent?.id || '');
      setInput("");
      inputRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = Boolean((selectedAgent || selectedMemberId === 'self') && input.trim() && !isLoading);
  const inputPlaceholder = isFirstMessage
    ? "请输入讨论主题，主持人将开启讨论..."
    : selectedMemberId === 'self'
    ? "以我的身份发送消息... (Cmd/Ctrl + Enter 发送，Shift + Enter 换行)"
    : selectedAgent
    ? `以 ${getAgentName(selectedAgent.id)} 的身份发送消息... (Cmd/Ctrl + Enter 发送，Shift + Enter 换行)`
    : "请先选择发送者...";

  return (
    <div className={cn(className)}>
      <div className="p-4 space-y-3">
        <MemberSelector
          selectedMemberId={selectedMemberId}
          setSelectedMemberId={setSelectedMemberId}
          selectedAgent={selectedAgent || undefined}
          availableMembers={availableMembers}
          agents={agents}
          isLoading={isLoading}
          isSelectDisabled={isSelectDisabled}
        />

        <form onSubmit={handleSubmit} className="flex gap-2">
          <AutoResizeTextarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (e.shiftKey) {
                  // Shift + Enter: 插入换行
                  return;
                }
                // 普通回车或 Cmd/Ctrl + Enter: 提交
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={inputPlaceholder}
            className="flex-1 min-h-[2.25rem] text-sm"
            disabled={!selectedMemberId || isLoading}
            minRows={1}
            maxRows={8}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!canSubmit}
            className={cn(
              "transition-all px-2 h-9 min-w-[36px] self-end",
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
