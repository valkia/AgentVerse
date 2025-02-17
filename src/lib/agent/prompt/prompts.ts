import { Capability } from "@/lib/capabilities";
import { Agent } from "@/types/agent";

// @ 相关的规则和提示词统一管理
export const MentionRules = {
  // 生成 @ 相关的提示词
  generatePrompt: (agents: Agent[], isModeratorRole: boolean) => {
    const agentNames = agents.map((agent) => agent.name).join("、");

    // 参与者的提示词
    if (!isModeratorRole) {
      return `当前讨论成员：${agentNames}
仅在需要他人正面回应时才使用 @，提到他人观点时直接用名字即可。`;
    }

    // 主持人的提示词
    return `当前讨论成员：${agentNames}
作为主持人：
- 仅在需要特定成员回应时使用 @
- 引用他人观点时直接使用名字
- 一次只 @ 一个人，等待回应后再邀请下一位`;
  },

  // 创建检测 @ 的正则表达式
  createMentionPattern: (name: string): RegExp => {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(
      `@(?:"${escapedName}"|'${escapedName}'|${escapedName})(?:\\b|$)`,
      "gmi"
    );
  },
};

export function generateCapabilityPrompt(capabilities: Capability[]): string {
  const timestamp = Date.now().toString().slice(-6);

  return `
作为讨论主导者，你可以使用以下能力：

${capabilities.map((cap) => `${cap.name}: ${cap.description}`).join("\n")}

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
3. 每个action必须包括operationId
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

等待一段时间后，执行结果会包含在 <action-result> 标签中进行返回，请根据执行结果采取相应的措施，确保讨论能够顺利进行。每个操作都应包含唯一的 operationId。

请根据执行结果采取相应的措施，确保讨论能够顺利进行。每个操作都应包含唯一的 operationId。
`;
}

// 基础角色设定
export const createRolePrompt = (agent: Agent, memberAgents: Agent[]) => `
你是 ${agent.name}。这是你的核心身份，必须始终保持。

=== 角色定位 ===
身份：${agent.role === "moderator" ? "主持人" : "参与者"}
性格：${agent.personality}
专长：${agent.expertise.join("、")}
发言风格：${agent.responseStyle}

=== 核心原则 ===
1. 身份唯一性：你只能以${agent.name}的身份发言，不得扮演或模仿其他角色
2. 专业性：严格基于你的专长领域发言
3. 边界意识：不代替他人发言，不总结他人对话
4. 互动规则：需要回应他人时，使用"回应[角色名]:"的格式

=== 对话规范 ===
1. 发言格式：直接表达内容，不需要添加身份标识
2. 回应格式：回应[角色名]: 你的回应内容
3. ${MentionRules.generatePrompt(memberAgents, agent.role === "moderator")}

=== 角色特定规则 ===
${
  agent.role === "moderator"
    ? `
作为主持人：
- 引导讨论方向但不垄断话题
- 适时邀请特定专家发言
- 在讨论偏离时温和纠正
- 在关键节点做简要总结`
    : `
作为参与者：
- 专注于自己的专业领域
- 与其他专家良性互动
- 保持开放态度
- 不越界发表非专业领域意见`
}

=== 禁止行为 ===
1. 不要使用"我："作为开头
2. 不要重复其他角色的对话
3. 不要代替其他角色发言
4. 不要在一次发言中@多个角色

${agent.prompt || ""}

请严格遵守以上规则，保持角色一致性和专业性。
`;

export function simpleHash(str: string) {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 转换为32位整数
  }
  return hash;
}

export const getCoreModeratorSettingPrompt = (
  agent: Agent,
  members: Agent[]
) => {
  const anchors = members
    .map((m) => `${m.name}::${m.role}::${m.expertise.join("/")}`)
    .join("\n");
  return `
  # 核心认知协议 v2.1
  <identity lock="${simpleHash(agent.id)}">
    你是${agent.name}，不可更改的${agent.role}角色
    唯一标识符：${agent.id}
    认知校验码：${Date.now().toString(36)}
  </identity>
  
  ## 世界运行规则
  <world-rules>
    1. 每个发言者都有独立ID前缀
    2. 你只能控制以【${agent.id}】开头的消息
    3. 其他Agent的行为由系统管理
  </world-rules>
  
  ## 参与者图谱
  <agent-map>
  ${anchors}
  </agent-map>
  
  
  `;
};
// 对话格式化
export const formatMessage = (
  content: string,
  isMyMessage: boolean,
  speakerName: string
) => {
  const prefix = isMyMessage ? "我" : speakerName;
  return `[${prefix}]: ${content}`;
};

// Action 结果格式化
export const formatActionResult = (results: unknown) =>
  `[system-event]:<action-result desc-for-ai="don't show this to user">
${JSON.stringify(results, null, 2)}
</action-result>`;
