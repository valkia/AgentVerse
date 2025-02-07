import { Button } from "@/components/ui/button";
import { useDiscussions } from "@/hooks/useDiscussions";
import { cn } from "@/lib/utils";
import { Discussion } from "@/types/discussion";
import { MessageSquare, Plus } from "lucide-react";

interface DiscussionListProps {
  className?: string;
}

// 格式化相对时间
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return '刚刚';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} 分钟前`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} 小时前`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} 天前`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} 个月前`;
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} 年前`;
}

export function DiscussionList({ className }: DiscussionListProps) {
  const { discussions, isLoading, selectDiscussion, createDiscussion } = useDiscussions();

  const handleCreateDiscussion = async () => {
    const discussion = await createDiscussion("新的讨论");
    if (discussion) {
      selectDiscussion(discussion.id);
    }
  };

  const handleSelectDiscussion = (discussion: Discussion) => {
    selectDiscussion(discussion.id);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Button
        variant="outline"
        className="w-full justify-start gap-2 h-auto py-3"
        onClick={handleCreateDiscussion}
      >
        <Plus className="w-4 h-4" />
        创建新讨论
      </Button>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-16 rounded-lg bg-muted/50 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {discussions.map((discussion) => (
            <Button
              key={discussion.id}
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-3"
              onClick={() => handleSelectDiscussion(discussion)}
            >
              <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 text-left">
                <div className="font-medium text-sm">
                  {discussion.title || "无标题讨论"}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {formatRelativeTime(new Date(discussion.createdAt))}
                </div>
              </div>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
} 