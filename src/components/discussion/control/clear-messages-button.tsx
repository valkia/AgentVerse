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
import { useDiscussions } from "@/hooks/useDiscussions";
import { cn } from "@/lib/utils";
import { Eraser } from "lucide-react";

interface ClearMessagesButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  mode?: "current" | "all";
}

export function ClearMessagesButton({
  className,
  variant = "ghost",
  size = "sm",
  mode = "current"
}: ClearMessagesButtonProps) {
  const { currentDiscussion, clearMessages, clearAllMessages } = useDiscussions();

  // 如果是清空当前会话且没有当前会话，则不显示
  if (mode === "current" && !currentDiscussion) return null;

  const handleClear = () => {
    if (mode === "current" && currentDiscussion) {
      clearMessages(currentDiscussion.id);
    } else if (mode === "all") {
      clearAllMessages();
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn(
            "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            className
          )}
        >
          {size === "icon" ? (
            <Eraser className="h-5 w-5" />
          ) : (
            <>
              <Eraser className="h-4 w-4 mr-2" />
              {mode === "current" ? "清空消息" : "清空所有"}
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {mode === "current" ? "清空当前会话" : "清空所有会话"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {mode === "current" 
              ? "此操作将清空当前会话的所有消息记录，此操作不可撤销。"
              : "此操作将清空所有会话的全部消息记录，此操作不可撤销。"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClear}
            className="bg-destructive hover:bg-destructive/90"
          >
            确认清空
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
