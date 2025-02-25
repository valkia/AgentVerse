import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAgents } from "@/hooks/useAgents";
import { useDiscussionMembers } from "@/hooks/useDiscussionMembers";
import { useModal } from "@/components/ui/modal";
import { cn, formatTime } from "@/lib/utils";
import { Download, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { DiscussionItemProps } from "./types";
import { DiscussionMember } from "@/types/discussion-member";

export function DiscussionItem({
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
  const modal = useModal();

  useEffect(() => {
    getMembersForDiscussion(discussion.id).then(setMembers);
  }, [discussion.id, getMembersForDiscussion]);

  const handleDelete = () => {
    modal.confirm({
      title: "删除讨论",
      description: "确定要删除这个讨论吗？此操作不可撤销。",
      okText: "确认删除",
      cancelText: "取消",
      onOk: onDelete
    });
  };

  return (
    <div 
      className={cn(
        "group relative flex items-center px-2 py-[7px] cursor-pointer",
        "hover:bg-accent/80 hover:shadow-sm active:bg-accent/90 transition-all duration-200",
        isActive && [
          "bg-accent/90 hover:bg-accent/95",
          "shadow-[0_0_0_1px] shadow-accent/20",
          "after:absolute after:left-0 after:top-[10%] after:bottom-[10%] after:w-[2px]",
          "after:bg-primary after:rounded-full"
        ],
        !isActive && [
          "after:absolute after:left-0 after:top-[10%] after:bottom-[10%] after:w-[2px]",
          "after:bg-primary/70 after:rounded-full after:opacity-0 after:transition-all after:duration-200",
          "hover:after:opacity-60"
        ]
      )}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('.discussion-actions')) {
          return;
        }
        onClick();
      }}
    >
      {/* 群组头像 */}
      <div className={cn(
        "w-[30px] h-[30px] bg-muted/40 rounded-[3px] shrink-0 overflow-hidden",
        "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]",
        members.length > 1 ? "grid grid-cols-2 gap-[1px] p-[1px]" : "flex items-center justify-center"
      )}>
        {members.length > 0 ? (
          members.length === 1 ? (
            // 单人头像
            <img
              src={getAgentAvatar(members[0].agentId)}
              alt={getAgentName(members[0].agentId)}
              className="w-[28px] h-[28px] rounded-[2px] object-cover"
            />
          ) : (
            // 多人头像网格
            members.slice(0, 4).map((member) => {
              const agent = agents.find((a) => a.id === member.agentId);
              if (!agent) return null;
              return (
                <div key={member.id} className="relative aspect-square">
                  <img
                    src={getAgentAvatar(agent.id)}
                    alt={getAgentName(agent.id)}
                    className="w-full h-full rounded-[1px] object-cover"
                  />
                </div>
              );
            })
          )
        ) : (
          // 空状态
          <div className="w-[28px] h-[28px] rounded-[2px] bg-muted/30" />
        )}
      </div>

      {/* 内容区 */}
      <div className="flex-1 min-w-0 ml-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <Input
                value={discussion.title}
                onChange={(e) => onRename(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    setIsEditing(false);
                  }
                }}
                onBlur={() => setIsEditing(false)}
                className="h-5 text-sm px-1"
                autoFocus
              />
            ) : (
              <div className="flex items-center gap-1">
                <span className={cn(
                  "text-[13px] leading-[1.2] truncate",
                  isActive ? "text-foreground font-medium" : "text-foreground/85"
                )}>{discussion.title}</span>
                {members.length > 0 && (
                  <span className="shrink-0 text-[11px] leading-[1.2] text-muted-foreground/50 translate-y-[0.5px]">
                    {members.length}人
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center shrink-0">
            <time className="text-[11px] leading-[1.2] text-muted-foreground/50 tabular-nums">
              {formatTime(discussion.lastMessageTime || discussion.createdAt)}
            </time>
            
            {/* Hover时显示的操作按钮 */}
            <div 
              className={cn(
                "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                "ml-1 -mr-1 discussion-actions"
              )}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-[18px] w-[18px] rounded-full",
                      "text-muted-foreground/40",
                      "hover:text-muted-foreground/90 hover:bg-background/40",
                      "active:bg-background/60",
                      "transition-colors duration-200"
                    )}
                  >
                    <MoreVertical className="h-[14px] w-[14px]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-[110px] p-1"
                  sideOffset={4}
                >
                  <DropdownMenuItem 
                    onClick={() => setIsEditing(true)}
                    className="h-7 text-[11px] px-2"
                  >
                    <Pencil className="h-2.5 w-2.5 mr-1.5" />
                    重命名
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      // TODO: 实现导出功能
                    }}
                    className="h-7 text-[11px] px-2"
                  >
                    <Download className="h-2.5 w-2.5 mr-1.5" />
                    导出记录
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-0.5" />
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="h-7 text-[11px] px-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-2.5 w-2.5 mr-1.5" />
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        
        <div className="text-[12px] leading-[1.4] text-muted-foreground/50 truncate mt-[2px]">
          {discussion.lastMessage || "还没有人发言"}
        </div>
      </div>
    </div>
  );
} 