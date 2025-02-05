/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Capability {
  name: string;
  description: string;
  execute: (params: any) => Promise<any>;
}

export class CapabilityRegistry {
  private static instance: CapabilityRegistry;
  private capabilities = new Map<string, Capability>();

  static getInstance() {
    if (!this.instance) {
      this.instance = new CapabilityRegistry();
    }
    return this.instance;
  }

  register(capability: Capability) {
    this.capabilities.set(capability.name, capability);
  }

  registerAll(capabilities: Capability[]) {
    capabilities.forEach((cap) => this.capabilities.set(cap.name, cap));
  }

  getCapabilities(): Capability[] {
    return Array.from(this.capabilities.values());
  }

  hasCapability(name: string): boolean {
    return this.capabilities.has(name);
  }

  async execute(
    name: string,
    params: any,
    options: {
      ignoreError?: boolean;
    } = {}
  ): Promise<any> {
    console.log("[CapabilityRegistry] execute:", name, "params:", params);
    const capability = this.capabilities.get(name);
    if (!capability && !options.ignoreError) {
      throw new Error(`Capability ${name} not found`);
    }
    return capability?.execute(params);
  }
}

export function generateCapabilityPrompt(capabilities: Capability[]): string {
  const timestamp = Date.now().toString().slice(-6);
  
  return `
作为讨论主导者，你可以使用以下能力：

${capabilities
  .map(
    (cap) =>
      `${cap.name}: ${cap.description}`
  )
  .join("\n")}

使用方式：
使用 :::action 容器语法来调用能力。每个action都需要包含一个简短的description字段，用于描述这个操作的目的或正在进行的操作。
这个描述会直接展示给用户看，所以要用自然的语言描述正在做什么。

operationId 生成规则：
1. 格式为：{capability}_{sequence}
2. sequence 是当前消息中的序号，从0开始
例如：searchFile_0, readFile_1

当前时间戳：${timestamp}
为确保operationId全局唯一，请在每次生成operationId时，将此时间戳添加到capability和sequence之间，如：searchFile_${timestamp}_0

语法要求：
1. :::action 后必须换行
2. 结束的 ::: 也必须换行
否则将无法正确解析。

示例：
:::action<换行>
{
    "capability": "searchFiles",
    "description": "搜索文件",
    "params": {
        "query": "*.ts"
    },
    "operationId": "searchFiles_${timestamp}_0"
}<换行>
:::<换行>

你也可以在一条消息中使用多个 action，每个action都需要有自己的描述：

接下来我先读取文件内容
:::action
{
    "capability": "readFile",
    "description": "读取文件内容",
    "params": {
        "path": "src/main.ts"
    },
    "operationId": "readFile_${timestamp}_0"
}
:::
现在我知道文件内容了，接下来我需要修改文件内容

:::action
{
    "capability": "editFile",
    "description": "编辑文件",
    "params": {
        "path": "src/main.ts",
        "content": "..."
    },
    "operationId": "editFile_${timestamp}_1"
}
:::

关于description的写作建议：
1. 使用第一人称，像在对话一样自然
2. 描述要简短但明确，说明正在做什么
3. 如果是复杂操作，可以说明目的
4. 避免技术术语，用户友好的描述

示例描述：
- "让我搜索一下相关的文件"
- "我来看看这段代码的实现"
- "正在安装需要的依赖"
- "我将修改配置文件来解决这个问题"
- "让我检查一下系统状态"

action调用完成后，系统会返回执行结果信息。

执行结果说明：
1. 成功：status 为 'success'，可以使用 result 中的数据
2. 解析错误：status 为 'parse_error'，说明 Action 格式有误，需要修正格式
3. 执行错误：status 为 'execution_error'，说明能力执行失败，需要检查参数或换其他方式
4. 未知错误：status 为 'unknown_error'，需要报告错误并尝试其他方案

请根据执行结果采取相应的措施，确保讨论能够顺利进行。每个操作都应包含唯一的 operationId。
`;
}
