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

  async execute(
    name: string,
    params: any,
    options: {
      ignoreError?: boolean;
    } = {}
  ): Promise<any> {
    const capability = this.capabilities.get(name);
    if (!capability && !options.ignoreError) {
      throw new Error(`Capability ${name} not found`);
    }
    return capability?.execute(params);
  }
}

export function generateCapabilityPrompt(capabilities: Capability[]): string {
  return `
作为讨论主导者，你可以使用以下能力：

${capabilities.map((cap) => `${cap.name}: ${cap.description}`).join("\n")}

使用方式：
你可以使用一个或多个action标签来执行能力，例如：
<action>
{
    "capability": "getMembers",
    "params": {}
}
</action>
<action>
{
    "capability": "addMember",
    "params": {
        "agentId": "some_id"
    }
}
</action>

执行结果说明：
1. 成功：status 为 'success'，可以使用 result 中的数据
2. 解析错误：status 为 'parse_error'，说明action格式有误，需要修正格式
3. 执行错误：status 为 'execution_error'，说明能力执行失败，需要检查参数或换其他方式
4. 未知错误：status 为 'unknown_error'，需要报告错误并尝试其他方案

请根据执行结果采取相应的措施，确保讨论能够顺利进行。
`;
}
