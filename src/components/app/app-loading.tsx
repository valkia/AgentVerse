import { Loader2 } from "lucide-react";

export function AppLoading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 text-transparent bg-clip-text mb-8">
        AgentVerse - 多Agent讨论空间
      </h1>
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
