import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Moon, Search, Settings, Sun, Users } from "lucide-react";
import { useState } from "react";
import React from "react";

// 动态导入对话框组件
const SettingsDialog = React.lazy(() => import("@/components/settings/settings-dialog").then(module => ({ default: module.SettingsDialog })));
const AddAgentDialog = React.lazy(() => import("@/components/agent/add-agent-dialog").then(module => ({ default: module.AddAgentDialog })));

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
  const [showSettings, setShowSettings] = useState(false);
  const statusText = status === "paused" ? "已暂停" : "讨论中";

  return (
    <>
      <header
        className={cn(
          "flex-none py-3 px-4 border-b dark:border-gray-800 backdrop-blur-sm bg-background/80 sticky top-0 z-50 transition-all duration-200",
          className
        )}
      >
        <div className="container mx-auto max-w-[1920px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="relative font-bold text-2xl">
              <span className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 bg-[200%_auto] animate-gradient-x bg-clip-text text-transparent">
                AgentVerse
              </span>
              <span className="invisible">AgentVerse</span>
              <span className="text-base font-medium text-muted-foreground ml-2">
                多Agent讨论空间
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-sm px-2.5 py-1.5 rounded-md transition-colors duration-200",
                status === "paused"
                  ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  : "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              )}
            >
              {statusText}
            </span>
            <div className="flex items-center gap-1.5">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 hover:bg-muted/80"
              >
                <Search className="h-[1.2rem] w-[1.2rem] text-muted-foreground/70" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:bg-muted/80"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="h-[1.2rem] w-[1.2rem] text-muted-foreground/70" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAgentManager(true)}
                className="h-9 w-9 hover:bg-muted/80"
              >
                <Users className="h-[1.2rem] w-[1.2rem] text-muted-foreground/70" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="h-9 w-9 hover:bg-muted/80"
              >
                {isDarkMode ? (
                  <Sun className="h-[1.2rem] w-[1.2rem] text-muted-foreground/70" />
                ) : (
                  <Moon className="h-[1.2rem] w-[1.2rem] text-muted-foreground/70" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <React.Suspense>
        <AddAgentDialog
          isOpen={showAgentManager}
          onOpenChange={setShowAgentManager}
        />
        <SettingsDialog
          open={showSettings}
          onOpenChange={setShowSettings}
        />
      </React.Suspense>
    </>
  );
}
