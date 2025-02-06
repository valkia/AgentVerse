import { cn } from "@/lib/utils";
import type { Root } from "mdast";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import type { Plugin } from "unified";
import type { Node } from "unist";
import { MarkdownErrorBoundary } from "./components/error-boundary";
import { MarkdownProps } from "./types";

/**
 * 基础 Markdown 组件
 * 提供基本的 Markdown 渲染功能，支持自定义插件
 */
export function Markdown({
  content,
  className,
  components,
  remarkPlugins = [remarkGfm as unknown as Plugin<[], Root>],
  rehypePlugins = [rehypeHighlight as unknown as Plugin<[], Node>],
}: MarkdownProps) {
  return (
    <MarkdownErrorBoundary content={content}>
      <div className={cn("prose dark:prose-invert", className)}>
        <ReactMarkdown
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
          components={components}
        >
          {content}
        </ReactMarkdown>
      </div>
    </MarkdownErrorBoundary>
  );
}
