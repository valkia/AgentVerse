import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";

interface ThemeToggleProps {
  isDarkMode: boolean;
  onToggle: () => void;
  className?: string;
}

export function ThemeToggle({ isDarkMode, onToggle, className }: ThemeToggleProps) {
  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={onToggle}
      className={cn("h-9 w-9 hover:bg-muted/80", className)}
    >
      {isDarkMode ? (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      )}
    </Button>
  );
} 