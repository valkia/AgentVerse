import { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  const rootClassName = useMemo(
    () => cn("h-screen w-screen flex flex-col overflow-hidden", isDarkMode ? "dark bg-gray-900" : "bg-gray-50"),
    [isDarkMode]
  );

  return {
    isDarkMode,
    toggleDarkMode,
    rootClassName,
  };
} 
