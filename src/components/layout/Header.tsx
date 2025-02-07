import { AddAgentDialog } from "@/components/agent/add-agent-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Moon, Search, Settings, Sun, Users } from "lucide-react";
import { useState } from "react";

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
  const [showAgentManager, setShowAgentManager] = useState(false);
  const statusText = status === "paused" ? "已暂停" : "讨论中";
  return (
    <>
      <header
        className={cn(
          "flex-none py-3 px-4 border-b dark:border-gray-800",
          className
        )}
      >
        <div className="container mx-auto max-w-[1920px] flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 text-transparent bg-clip-text">
            AgentVerse - 多Agent协作
          </h1>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-sm px-2 py-1 rounded-md",
                status === "paused"
                  ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  : "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              )}
            >
              {statusText}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAgentManager(true)}
                className="h-9 w-9"
              >
                <Users className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="h-9 w-9"
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <AddAgentDialog
        isOpen={showAgentManager}
        onOpenChange={setShowAgentManager}
      />
    </>
  );
}
