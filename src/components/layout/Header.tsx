import { cn } from "@/lib/utils";
import { MemberManagement } from "../agent/member-management";
import { Logo } from "../common/logo";
import { StatusIndicator } from "../common/status-indicator";
import { ThemeToggle } from "../common/theme-toggle";
import { SettingsFeature } from "../settings/settings-feature";

interface HeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  status: string;
  className?: string;
}

export function Header({
  isDarkMode,
  toggleDarkMode,
  status,
  className,
}: HeaderProps) {
  return (
    <header
      className={cn(
        "flex-none py-3 px-4 border-b dark:border-gray-800 backdrop-blur-sm bg-background/80 sticky top-0 z-50 transition-all duration-200",
        className
      )}
    >
      <div className="container mx-auto max-w-[1920px] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo />
        </div>

        <div className="flex items-center gap-2">
          <StatusIndicator status={status as "active" | "paused"} />
          <div className="flex items-center gap-1.5">
            <SettingsFeature />
            <MemberManagement />
            <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleDarkMode} />
          </div>
        </div>
      </div>
    </header>
  );
}
