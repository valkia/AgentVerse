import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "../common/theme-toggle";
import { MemberManagement } from "../agent/member-management";
import { SettingsFeature } from "../settings/settings-feature";

interface MobileHeaderProps {
  title?: string;
  onToggleSidebar?: () => void;
  isDarkMode?: boolean;
  onThemeToggle?: () => void;
  className?: string;
}

export function MobileHeader({
  title = "讨论系统",
  onToggleSidebar,
  isDarkMode = false,
  onThemeToggle = () => {},
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
        <SettingsFeature className="h-8 w-8" />
        <MemberManagement className="h-8 w-8" />
        <ThemeToggle 
          isDarkMode={isDarkMode} 
          onToggle={onThemeToggle}
          className="h-8 w-8"
        />
      </div>
    </header>
  );
} 