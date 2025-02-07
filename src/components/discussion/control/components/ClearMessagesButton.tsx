import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/hooks/useMessages";
import { messageService } from "@/services/message.service";
import { Eraser, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ClearMessagesButtonProps {
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
}

export function ClearMessagesButton({
  size = "default",
  variant = "ghost",
  className,
}: ClearMessagesButtonProps) {
  const { messages } = useMessages();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleClear = async () => {
    if (messages.length === 0) return;
    setIsLoading(true);

    try {
      await messageService.clearMessages(messages[0].discussionId);
      toast({
        title: "清除成功",
        description: "所有消息已清除",
      });
    } catch (error) {
      console.error("Error clearing messages:", error);
      toast({
        title: "清除失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          disabled={messages.length === 0 || isLoading}
          title="清空消息"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Eraser className="w-4 h-4" />
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确定要清空所有消息吗？</AlertDialogTitle>
          <AlertDialogDescription>
            此操作将删除当前讨论中的所有消息记录，此操作不可撤销。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleClear}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : null}
            确定清空
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 