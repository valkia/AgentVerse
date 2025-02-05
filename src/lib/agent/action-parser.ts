// action-parser.ts

export interface ActionParseResult<T = FlowDef | ActionGroupDef | ActionDef> {
  raw: string;
  parsed?: T;
  error?: string;
}

export interface ActionDef {
  operationId: string;
  type: "action";
  capability: string;
  description: string; // GPT生成的操作描述
  params: Record<string, unknown>;
  await?: boolean;
}

export interface ActionGroupDef {
  type: "action-group";
  actions: ActionParseResult<ActionDef>[];
  await?: boolean;
}

export interface FlowDef {
  type: "flow";
  operations: ActionParseResult<ActionDef | ActionGroupDef>[];
  await?: boolean;
}

export class ActionParser {
  parse(content: string): ActionParseResult[] {
    const operations: ActionParseResult[] = [];

    // 匹配 :::action 语法，更健壮的版本：
    // 1. 允许 :::action 后面可以有或没有换行
    // 2. 允许结束的 ::: 前面可以有或没有换行
    // 3. 使用非贪婪匹配确保正确匹配嵌套的情况
    const actionRegex = /:::action\s*(?:\n|\s)([\s\S]*?)(?:\n|\s):::\s*/g;
    let match;

    while ((match = actionRegex.exec(content)) !== null) {
      const jsonContent = match[1].trim();
      try {
        const parsed = JSON.parse(jsonContent);
        if (!parsed.operationId) {
          throw new Error("Missing required field: operationId");
        }
        if (!parsed.description) {
          throw new Error("Missing required field: description");
        }
        operations.push({
          raw: jsonContent,
          parsed: {
            type: "action",
            ...parsed,
            await: Boolean(parsed.await),
          },
        });
      } catch (error) {
        operations.push({
          raw: jsonContent,
          error: `Failed to parse action: ${error}`,
        });
      }
    }

    return operations;
  }
}
