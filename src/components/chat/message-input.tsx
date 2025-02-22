import { Button } from "@/components/ui/button";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import { cn } from "@/lib/utils";
import { Loader2, Send } from "lucide-react";
import { useRef, useState, forwardRef, useImperativeHandle } from "react";

export interface MessageInputRef {
  setValue: (value: string) => void;
  focus: () => void;
}

interface MessageInputProps {
  onSendMessage: (content: string, agentId: string) => Promise<void>;
  className?: string;
  isFirstMessage?: boolean;
}

export const MessageInput = forwardRef<MessageInputRef, MessageInputProps>(
  function MessageInput({ onSendMessage, className, isFirstMessage = false }, ref) {
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      setValue: (value: string) => {
        setInput(value);
        // 设置值后自动聚焦输入框
        inputRef.current?.focus();
      },
      focus: () => {
        inputRef.current?.focus();
      }
    }));

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit) return;

      try {
        setIsLoading(true);
        await onSendMessage(input.trim(), 'user');
        setInput("");
        inputRef.current?.focus();
      } finally {
        setIsLoading(false);
      }
    };

    const canSubmit = Boolean(input.trim() && !isLoading);
    const inputPlaceholder = isFirstMessage
      ? "请输入讨论主题，主持人将开启讨论..."
      : "发送消息... (Enter 发送，Shift/Cmd/Ctrl + Enter 换行)";

    return (
      <div className={cn(className)}>
        <div className="p-4 space-y-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <AutoResizeTextarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  // 如果按下了任何修饰键，允许换行
                  if (e.shiftKey || e.metaKey || e.ctrlKey) {
                    return;
                  }
                  // 单纯的 Enter 键，发送消息
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={inputPlaceholder}
              className="flex-1 min-h-[2.25rem] text-sm"
              disabled={isLoading}
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
);
