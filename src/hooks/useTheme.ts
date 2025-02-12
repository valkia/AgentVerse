import { cn } from "@/lib/utils";
import { useMemoizedFn } from "ahooks";
import { useEffect, useMemo, useState } from "react";

type Theme = 'light' | 'dark' | 'system';

const THEME_KEY = 'app-theme';

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // 从 localStorage 读取主题设置
    const savedTheme = localStorage.getItem(THEME_KEY);
    return (savedTheme as Theme) || 'system';
  });

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getSystemTheme());

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // 切换主题
  const setThemeWithPersist = useMemoizedFn((newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);

    // 添加/移除 dark 类
    const root = window.document.documentElement;
    if (newTheme === 'system') {
      const isSystemDark = getSystemTheme() === 'dark';
      root.classList.toggle('dark', isSystemDark);
    } else {
      root.classList.toggle('dark', newTheme === 'dark');
    }

    // 添加过渡动画类
    root.classList.add('theme-transition');
    setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 300);
  });

  // 切换暗色/亮色模式
  const toggleDarkMode = useMemoizedFn(() => {
    const currentTheme = theme === 'system' ? systemTheme : theme;
    setThemeWithPersist(currentTheme === 'dark' ? 'light' : 'dark');
  });

  // 初始化主题
  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'system' ? systemTheme === 'dark' : theme === 'dark';
    root.classList.toggle('dark', isDark);
  }, [theme, systemTheme]);

  const isDarkMode = theme === 'system' ? systemTheme === 'dark' : theme === 'dark';

  const rootClassName = useMemo(
    () => cn(
      "h-screen w-screen flex flex-col overflow-hidden",
      isDarkMode ? "bg-gray-900" : "bg-gray-50"
    ),
    [isDarkMode]
  );

  return {
    theme,
    setTheme: setThemeWithPersist,
    isDarkMode,
    toggleDarkMode,
    rootClassName,
  };
} 
