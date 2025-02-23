import { Button } from "@/components/ui/button";
import { Menu, MoreVertical, PauseCircle, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { MobileActionSheet } from "./mobile-action-sheet";

interface MobileHeaderProps {
  title?: string;
  onToggleSidebar?: () => void;
  className?: string;
  status?: "active" | "paused";
  onStatusChange?: (status: "active" | "paused") => void;
  onManageMembers?: () => void;
  onOpenSettings?: () => void;
  onClearMessages?: () => void;
}

export function MobileHeader({
  title = "讨论系统",
  onToggleSidebar,
  className,
  status = "paused",
  onStatusChange = () => {},
  onManageMembers = () => {},
  onClearMessages = () => {},
}: MobileHeaderProps) {
  const [showActions, setShowActions] = useState(false);
  const isActive = status === "active";

  const handleStatusChange = () => {
    const newStatus = isActive ? "paused" : "active";
    onStatusChange(newStatus);
  };

  return (
    <>
      <header 
        className={cn(
          "h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden",
          className
        )}
      >
        <div className="flex h-full items-center px-4 gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onToggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <h1 className="text-lg font-medium flex-1">{title}</h1>
          
          <div className="flex items-center gap-2">
            <Button
              variant={isActive ? "destructive" : "default"}
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleStatusChange}
            >
              {isActive ? (
                <PauseCircle className="h-5 w-5" />
              ) : (
                <PlayCircle className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowActions(true)}
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <MobileActionSheet
        open={showActions}
        onOpenChange={setShowActions}
        onManageMembers={onManageMembers}
        onClearMessages={onClearMessages}
      />
    </>
  );
} 