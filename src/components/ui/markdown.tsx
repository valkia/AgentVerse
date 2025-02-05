import { Action } from "@/components/discussion/message-markdown-content";
import { remarkAction } from "@/lib/markdown/remark-action";
import { cn } from "@/lib/utils";
import type { Root as MdastRoot } from "mdast";
import ReactMarkdown, { Components } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import type { Node } from "unist";
import { visit } from "unist-util-visit";
import { Component, ErrorInfo, ReactNode } from "react";

// 添加 ErrorBoundary 组件
class MarkdownErrorBoundary extends Component<
  { children: ReactNode; content: string },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; content: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Markdown rendering error:", error);
    console.error("Error details:", errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // 降级渲染，直接显示原始内容
      return (
        <div className="text-sm whitespace-pre-wrap break-words text-gray-600 dark:text-gray-400">
          {this.props.content}
        </div>
      );
    }

    return this.props.children;
  }
}

// 定义 ActionNode 类型
interface ActionNode extends Node {
  type: "action";
  value: string;
  data: {
    operationId: string;
    capability: string;
    params: Record<string, unknown>;
    await?: boolean;
    actionResults?: {
      [operationId: string]: {
        status: "success" | "error";
        result?: unknown;
        error?: string;
      };
    };
    hName: string;
    hProperties: {
      value: string;
      data: {
        operationId: string;
        capability: string;
        params: Record<string, unknown>;
        await?: boolean;
        actionResults?: {
          [operationId: string]: {
            status: "success" | "error";
            result?: unknown;
            error?: string;
          };
        };
      };
    };
  };
}

interface ActionProps {
  node: {
    type: string;
    tagName: string;
    properties: {
      value: string;
      data: {
        capability: string;
        params: Record<string, unknown>;
        await?: boolean;
        actionResults?: {
          [operationId: string]: {
            status: "success" | "error";
            result?: unknown;
            error?: string;
          };
        };
        operationId?: string;
      };
    };
    children?: Array<{ type: string; value?: string }>;
  };
}

interface MarkdownProps {
  content: string;
  className?: string;
  components?: Partial<Components>;
  actionResults?: {
    [operationId: string]: {
      capability: string;
      params: Record<string, unknown>;
      status: "success" | "error";
      result?: unknown;
      error?: string;
    };
  };
}

// 自定义 remark 插件，用于处理 mdast 到 hast 的转换
function remarkMdastToHast() {
  return (tree: MdastRoot) => {
    visit(tree, "action", (node: ActionNode) => {
      node.data = node.data || {};
      node.data.hName = "action";
      node.data.hProperties = {
        value: node.value,
        data: node.data, // 直接传递整个 data 对象
      };
    });
  };
}

const defaultComponents: Partial<Components> = {
  // @ts-expect-error - action 是自定义节点类型
  action: (props: ActionProps) => {
    // 尝试从 value 中解析数据
    let actionData;
    console.log("actionProps:", props);
    try {
      const parsedValue = JSON.parse(props.node.properties.value);
      const data = props.node.properties.data;
      console.log("[Action Component] Processing:", {
        parsedValue,
        data,
        actionResults: parsedValue.actionResults,
        operationId: parsedValue.operationId || data.operationId,
        result:
          data.actionResults?.[parsedValue.operationId || data.operationId],
      });
      const operationId =
        parsedValue.operationId ||
        data.operationId ||
        Object.keys(parsedValue.actionResults || {})[0];

      actionData = {
        operationId: operationId,
        capability: parsedValue.capability,
        params: parsedValue.params || {},
        await: parsedValue.await,
        result: parsedValue.actionResults?.[operationId],
        description: parsedValue.description,
      };
    } catch (error) {
      console.error("Failed to parse action value:", error);
      return null;
    }

    if (!actionData.capability) {
      console.error("Missing capability in action data");
      return null;
    }
    return <Action data={actionData} />;
  },
  p: ({ ...props }) => <p {...props} />,
};

export function Markdown({
  content,
  className,
  components,
  actionResults,
}: MarkdownProps) {
  console.log("[Markdown] Rendering with:", { content, actionResults });

  const plugins = [
    remarkGfm,
    [remarkAction, { actionResults }],
    remarkMdastToHast,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ] as unknown[] as any[];

  return (
    <MarkdownErrorBoundary content={content}>
      <div className={cn("prose dark:prose-invert", className)}>
        <ReactMarkdown
          remarkPlugins={plugins}
          rehypePlugins={[
            rehypeHighlight,
            [rehypeRaw, { passThrough: ['action'] }]
          ]}
          components={{
            ...defaultComponents,
            ...components,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </MarkdownErrorBoundary>
  );
}
