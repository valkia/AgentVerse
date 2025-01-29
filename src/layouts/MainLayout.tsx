import { ReactNode } from "react";

interface MainLayoutProps {
  children: ReactNode;
  header?: ReactNode;
}

export function MainLayout({ children, header }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {header || (
        <header className="flex-none p-4 border-b bg-background sticky top-0 z-50">
          <div className="container mx-auto">
            <h1 className="text-2xl font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2">
              多Agent讨论系统
            </h1>
            <p className="text-muted-foreground">创建和管理你的AI讨论成员</p>
          </div>
        </header>
      )}
      <main className="flex-1 container mx-auto p-4 max-w-[1920px]">
        {children}
      </main>
    </div>
  );
} 