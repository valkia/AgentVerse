import { Markdown } from "@/components/ui/markdown";
import type { Root } from "mdast";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import type { Plugin } from "unified";
import type { Node } from "unist";
import { Action } from "../message-actions";
import { remarkAction } from "./plugins/remark-action";
import { remarkMdastToHast } from "./plugins/remark-mdast-to-hast";
import {
  ActionComponentProps,
  ActionData,
  ActionNode,
  DiscussionMarkdownProps,
  MarkdownActionResults,
} from "./types";

/**
 * 讨论专用的 Markdown 组件
 * 在基础 Markdown 组件的基础上添加了 action 支持
 */
export function DiscussionMarkdown({
  content,
  className,
  components,
  actionResults,
  ActionComponent = Action,
  remarkPlugins = [],
  rehypePlugins = [],
}: DiscussionMarkdownProps) {
  // 合并插件
  const finalRemarkPlugins = [
    remarkGfm as Plugin<[], Root>,
    [remarkAction, { actionResults }] as [
      Plugin<[], Root>,
      { actionResults: typeof actionResults }
    ],
    remarkMdastToHast as Plugin<[], Root>,
    ...remarkPlugins,
  ];

  const finalRehypePlugins = [
    rehypeHighlight as unknown as Plugin<[], Node>,
    [rehypeRaw as unknown as Plugin<[], Node>, { passThrough: ["action"] }],
    ...rehypePlugins,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ] as any[];

  return (
    <Markdown
      content={content}
      className={className}
      components={{
        ...components,
        // @ts-expect-error - action 是自定义节点类型
        action: (props) => {
          if (!ActionComponent) return null;
          try {
            const data = JSON.parse(props.node.properties.value);
            return <ActionComponent data={data} />;
          } catch (error) {
            console.error("Failed to parse action data:", error);
            return null;
          }
        },
      }}
      remarkPlugins={finalRemarkPlugins}
      rehypePlugins={finalRehypePlugins}
    />
  );
}

export type {
  ActionComponentProps,
  ActionData,
  ActionNode,
  DiscussionMarkdownProps,
  MarkdownActionResults
};

