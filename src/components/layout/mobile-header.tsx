import { Button } from "@/components/ui/button";
import { Menu, Users, Sun, Moon, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  title?: string;
  onToggleSidebar?: () => void;
  onShowAgentManagementPanel?: () => void;
  onShowSettings?: () => void;
  isDarkMode?: boolean;
  onThemeToggle?: () => void;
  className?: string;
}

export function MobileHeader({
  title = "讨论系统",
  onToggleSidebar,
  onShowAgentManagementPanel,
  onShowSettings,
  isDarkMode,
  onThemeToggle,
  className
}: MobileHeaderProps) {
  return (
    <header className={cn(
      "h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden",
      className
    )}>
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
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onShowSettings}
        >
          <Settings className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onShowAgentManagementPanel}
        >
          <Users className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onThemeToggle}
        >
          {isDarkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </div>
    </header>
  );
} 