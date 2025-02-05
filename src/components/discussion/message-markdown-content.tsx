import { Markdown } from "@/components/ui/markdown";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";

interface ActionDisplayProps {
  capability: string;
  description: string;
  params: Record<string, unknown>;
  await?: boolean;
  status?: "pending" | "running" | "success" | "error";
  onRetry?: () => void;
  onCancel?: () => void;
  result?: unknown;
  error?: string;
}

function getStatusIcon(status?: string) {
  switch (status) {
    case "pending":
    case "running":
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    case "success":
      return (
        <span className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
          ✓
        </span>
      );
    case "error":
      return (
        <span className="w-4 h-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
          !
        </span>
      );
    default:
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
  }
}

function ActionDisplay({
  capability,
  description,
  params,
  status,
  result,
  error,
  onRetry,
  onCancel,
}: ActionDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isPending = !status || status === "pending" || status === "running";
  
  return (
    <div className="space-y-2 text-sm">
      {/* 主要信息行 */}
      <div 
        className="flex items-start gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 -mx-2 rounded-md transition-colors group" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-shrink-0 mt-1">
          {getStatusIcon(status)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-200">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-500" />
            )}
            <span className="font-medium">{description}</span>
          </div>
          
          {/* 只显示错误状态 */}
          {!isPending && status === "error" && (
            <div className="mt-1.5 ml-5">
              <div className="text-red-500 dark:text-red-400">
                {error || "执行失败"}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 展开的详细信息（仅供调试使用） */}
      {isExpanded && (
        <div className="ml-6 space-y-3 bg-gray-50 dark:bg-gray-800/50 rounded-md p-3 text-xs">
          <div className="text-gray-400 dark:text-gray-500 italic">
            调试信息
          </div>
          <pre className="bg-gray-100 dark:bg-gray-800 p-2.5 rounded-md overflow-auto text-gray-600 dark:text-gray-400 leading-relaxed">
            {JSON.stringify({
              capability,
              params,
              status,
              result,
              error
            }, null, 2)}
          </pre>

          {/* 操作按钮 */}
          <div className="flex items-center gap-2">
            {status === "error" && onRetry && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRetry();
                }}
                className="px-2.5 py-1 text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full transition-colors"
              >
                重试
              </button>
            )}
            {status === "running" && onCancel && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel();
                }}
                className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full transition-colors"
              >
                取消
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function Action({
  data,
}: {
  data: {
    operationId: string;
    capability: string;
    description: string;
    params: Record<string, unknown>;
    await?: boolean;
    result?: {
      status: "success" | "error";
      result?: unknown;
      error?: string;
    };
  };
}) {
  if (!data?.capability) {
    console.error("Invalid action data:", data);
    return null;
  }

  return (
    <ActionDisplay
      {...data}
      status={data.result?.status}
      result={data.result?.result}
      error={data.result?.error}
    />
  );
}

export function MessageMarkdownContent({
  content,
  className,
  actionResults,
}: {
  content: string;
  className?: string;
  actionResults?: {
    [operationId: string]: {
      capability: string;
      description: string;
      params: Record<string, unknown>;
      status: "success" | "error";
      result?: unknown;
      error?: string;
    };
  };
}) {
  return (
    <Markdown
      className={className}
      content={content}
      actionResults={actionResults}
    />
  );
}
