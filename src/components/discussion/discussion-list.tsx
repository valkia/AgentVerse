import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAgents } from "@/hooks/useAgents";
import { useDiscussionMembers } from "@/hooks/useDiscussionMembers";
import { useDiscussions } from "@/hooks/useDiscussions";
import { cn } from "@/lib/utils";
import { discussionsResource, messagesResource } from "@/resources";
import { DEFAULT_DISCUSSION_TITLE } from "@/services/common.util";
import { filterNormalMessages } from "@/services/message.util";
import { Discussion } from "@/types/discussion";
import { DiscussionMember } from "@/types/discussion-member";
import {
  Loader2,
  MoreVertical,
  Pencil,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

interface DiscussionListProps {
  className?: string;
  headerClassName?: string;
  listClassName?: string;
  onSelectDiscussion?: (discussionId: string) => void;
}

interface DiscussionItemProps {
  discussion: Discussion;
  isActive: boolean;
  onClick: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}

interface DiscussionItemTitleProps {
  title: string;
  isEditing: boolean;
  onTitleChange: (title: string) => void;
  onEditEnd: () => void;
}

function DiscussionItemTitle({
  title,
  isEditing,
  onTitleChange,
  onEditEnd,
}: DiscussionItemTitleProps) {
  const [editingTitle, setEditingTitle] = useState(title);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onTitleChange(editingTitle);
      onEditEnd();
    } else if (e.key === "Escape") {
      setEditingTitle(title);
      onEditEnd();
    }
  };

  const handleBlur = () => {
    onTitleChange(editingTitle);
    onEditEnd();
  };

  if (isEditing) {
    return (
      <Input
        value={editingTitle}
        onChange={(e) => setEditingTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="h-6 text-xs px-1.5 w-[200px]"
        autoFocus
      />
    );
  }

  return (
    <div className="flex items-center gap-2">
      <h3 className="text-sm font-medium truncate">{title}</h3>
    </div>
  );
}

function DiscussionItem({
  discussion,
  isActive,
  onClick,
  onRename,
  onDelete,
}: DiscussionItemProps) {
  const { agents, getAgentName, getAgentAvatar } = useAgents();
  const { getMembersForDiscussion } = useDiscussionMembers();
  const [members, setMembers] = useState<DiscussionMember[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    getMembersForDiscussion(discussion.id).then(setMembers);
  }, [discussion.id, getMembersForDiscussion]);

  const handleClick = (e: React.MouseEvent) => {
    // 如果点击的是下拉菜单或输入框，不触发选中
    if ((e.target as HTMLElement).closest(".discussion-actions, input")) {
      return;
    }
    onClick();
  };

  return (
    <Card
      className={cn(
        "w-full p-4 cursor-pointer hover:bg-muted/50 transition-colors group",
        isActive && "bg-accent"
      )}
      onClick={handleClick}
      data-testid="discussion-item"
      data-discussion-id={discussion.id}
    >
      <div className="space-y-0.5">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex-1 min-w-0">
            <DiscussionItemTitle
              title={discussion.title}
              isEditing={isEditing}
              onTitleChange={onRename}
              onEditEnd={() => setIsEditing(false)}
            />
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 discussion-actions"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  重命名
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">
          <time className="text-xs text-muted-foreground">
            {new Date(discussion.createdAt).toLocaleString("zh-CN", {
              month: "numeric",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
            })}
          </time>
        </p>
        <div className="flex items-center gap-1 overflow-hidden">
          {members.slice(0, 4).map((member) => {
            const agent = agents.find((a) => a.id === member.agentId);
            if (!agent) return null;
            return (
              <img
                key={member.id}
                src={getAgentAvatar(agent.id)}
                alt={getAgentName(agent.id)}
                className="w-6 h-6 rounded-full shrink-0"
                title={getAgentName(agent.id)}
              />
            );
          })}
          {members.length > 4 && (
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground shrink-0">
              +{members.length - 4}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export function DiscussionList({
  className,
  headerClassName,
  listClassName,
  onSelectDiscussion,
}: DiscussionListProps) {
  const { agents } = useAgents();
  const {
    discussions,
    currentDiscussion,
    isLoading,
    createDiscussion,
    selectDiscussion,
    updateDiscussion,
    deleteDiscussion,
  } = useDiscussions();

  const handleCreateDiscussion = async () => {
    if (agents.length === 0) return;
    const discussion = await createDiscussion("新的讨论");
    if (discussion) {
      selectDiscussion(discussion.id);
    }
  };

  useEffect(() => {
    // 监听消息变化并更新标题
    return messagesResource.current.subscribe(async (state) => {
      if (state.data && !state.isValidating && !state.isLoading) {
        const messages = filterNormalMessages(state.data);
        if (messages.length) {
          const discussion = discussionsResource.current.getState().data;
          if (discussion && discussion.title === DEFAULT_DISCUSSION_TITLE) {
            try {
              // 使用 AIService 生成标题
              updateDiscussion(messages[0].discussionId, {
                title: messages[0].content.slice(0, 50),
              });
              // const newTitle = await aiService.generateDiscussionTitle(
              //   messages
              // );
              // if (newTitle && newTitle !== discussion.title) {
              //   updateDiscussion(discussion.id, { title: newTitle });
              // }
            } catch (error) {
              console.error("Failed to generate discussion title:", error);
            }
          }
        }
      }
    });
  }, []);

  const handleSelectDiscussion = (discussionId: string) => {
    selectDiscussion(discussionId);
    onSelectDiscussion?.(discussionId);
  };

  return (
    <div
      className={cn("flex flex-col flex-1 overflow-hidden h-full", className)}
    >
      <header
        className={cn(
          "flex-none flex justify-between items-center mb-3 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 z-10 py-2 px-4 pt-4",
          headerClassName
        )}
      >
        <h2 className="text-lg font-medium">会话列表</h2>
        <Button
          onClick={handleCreateDiscussion}
          variant="outline"
          size="sm"
          disabled={isLoading || agents.length === 0}
          className="h-8 px-3 hover:bg-muted/50"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
          )}
          新建会话
        </Button>
      </header>

      <div
        className={cn("flex-1 min-h-0 overflow-y-auto p-4 pt-0", listClassName)}
      >
        <div className="space-y-2 pb-4">
          {discussions.map((discussion) => (
            <DiscussionItem
              key={discussion.id}
              discussion={discussion}
              isActive={discussion.id === currentDiscussion?.id}
              onClick={() => handleSelectDiscussion(discussion.id)}
              onRename={(title) => updateDiscussion(discussion.id, { title })}
              onDelete={() => deleteDiscussion(discussion.id)}
            />
          ))}
        </div>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <Loader2 className="w-7 h-7 animate-spin text-primary/70" />
          </div>
        )}
      </div>
    </div>
  );
}
