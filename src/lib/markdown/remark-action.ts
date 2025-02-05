import type { Paragraph, Root, RootContent, Text } from 'mdast';
import type { Node } from 'unist';
import { visit } from 'unist-util-visit';

// 定义我们的自定义节点类型
type ActionData = {
  operationId: string;
  capability: string;
  params: Record<string, unknown>;
  await?: boolean;
  result?: {
    status: 'success' | 'error';
    result?: unknown;
    error?: string;
  };
  actionResults?: {
    [operationId: string]: {
      status: 'success' | 'error';
      result?: unknown;
      error?: string;
    }
  };
  hName: string;
  hProperties: {
    value: string;
    data: {
      operationId: string;
      capability: string;
      params: Record<string, unknown>;
      await?: boolean;
      result?: {
        status: 'success' | 'error';
        result?: unknown;
        error?: string;
      };
      actionResults?: {
        [operationId: string]: {
          status: 'success' | 'error';
          result?: unknown;
          error?: string;
        }
      };
    };
  };
};

interface ActionNode extends Node {
  type: 'action';
  value: string;
  data: ActionData;
  children: never[];
}

declare module 'mdast' {
  interface StaticPhrasingContentMap {
    action: ActionNode;
  }
  interface RootContentMap {
    action: ActionNode;
  }
}

declare module 'hast' {
  interface ElementContentMap {
    action: ActionNode;
  }
}

export function remarkAction(options: { 
  actionResults?: {
    [operationId: string]: {
      capability: string;
      params: Record<string, unknown>;
      status: 'success' | 'error';
      result?: unknown;
      error?: string;
    }
  } 
} = {}) {
  return (tree: Root) => {
    const actionResults = options.actionResults || {};
    console.log('[remarkAction] Running with options:', { actionResults });
    
    visit(tree, 'paragraph', (node: Paragraph, index, parent: Root | null) => {
      if (!parent || typeof index !== 'number') return;

      const firstChild = node.children[0];
      if (!firstChild || firstChild.type !== 'text') return;

      const text = (firstChild as Text).value;
      const actionRegex = /:::action(?:\s+|\s*\n)([\s\S]*?)(?:\s*\n|)\s*:::\s*/g;
      let match;

      while ((match = actionRegex.exec(text)) !== null) {
        const jsonContent = match[1].trim();
        try {
          const parsed = JSON.parse(jsonContent);
          if (!parsed.operationId) {
            throw new Error("Missing required field: operationId");
          }
          if (!parsed.description) {
            throw new Error("Missing required field: description");
          }
          const result = actionResults[parsed.operationId];
          
          console.log('[remarkAction] Processing action:', { 
            parsed, 
            actionResults,
            operationId: parsed.operationId,
            result
          });

          const actionNode: ActionNode = {
            type: 'action',
            value: JSON.stringify({
              ...parsed,
              result,  // 在 value 中也包含结果
              actionResults,
            }),
            data: {
              operationId: parsed.operationId,
              capability: parsed.capability,
              params: parsed.params || {},
              await: Boolean(parsed.await),
              result,  // 直接存储结果
              actionResults,  // 存储所有结果
              hName: 'action',
              hProperties: {
                value: JSON.stringify(parsed),
                data: {
                  operationId: parsed.operationId,
                  capability: parsed.capability,
                  params: parsed.params || {},
                  await: Boolean(parsed.await),
                  result,  // 在 hProperties 中也包含结果
                  actionResults  // 在 hProperties 中也包含所有结果
                }
              }
            },
            position: node.position,
            children: []
          };

          parent.children[index] = actionNode as RootContent;
        } catch (err) {
          console.error('Failed to parse action:', err);
        }
      }
    });
  };
} 