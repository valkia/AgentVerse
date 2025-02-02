import { Agent } from "@/types/agent";

export interface MentionRule {
  description: string;
  examples: string[];
  generatePrompt: (agents: Agent[]) => string;
  createMentionPattern: (name: string) => RegExp;
}

function createMentionPattern(name: string): RegExp {
  // 转义正则表达式中的特殊字符
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  const pattern = [
    '@' + escapedName,         // @名字
    '@"' + escapedName + '"',  // @"名字"
    "@'" + escapedName + "'"   // @'名字'
  ].join('|');

  // 添加 gmi 标志：
  // g: 全局匹配
  // m: 多行匹配
  // i: 不区分大小写
  return new RegExp(`(${pattern})(?:\\b|$)`, 'gmi');
}

export const MENTION_RULE: MentionRule = {
  description: "使用 @ 功能来指定特定的参与者发言",
  examples: [
    "@数据专家 请分析这组数据的趋势",
    '@"技术顾问" 这个方案在技术上是否可行？',
    "让 @产品经理 先评估一下这个功能的优先级"
  ],
  generatePrompt: (agents: Agent[]) => {
    const agentNames = agents.map(agent => `@${agent.name}`).join('、');
    return `作为主持人，你可以通过 @ 功能来指定特定的参与者发言。当前的参与者包括：${agentNames}

为了保持对话的有序性和清晰度，请遵循以下原则：

1. 一次只@ 一个参与者，让讨论更有焦点
2. 等待被@ 的参与者回复后，再@ 下一个参与者
3. 在@ 某人时，请明确说明你希望他们关注的具体问题或方面

支持以下 @ 格式：
- @名字
- @"名字"
- @'名字'

示例用法：
${MENTION_RULE.examples.map(example => `- ${example}`).join('\n')}

不推荐的用法：
- ❌ "请 @产品经理 和 @开发主管 一起评估" (不要同时@ 多人)
- ❌ "@技术顾问 怎么看？" (问题不够具体)
- ❌ "@产品经理 @开发主管 @测试主管" (避免连续@ 多人)

推荐的对话流程：
1. @产品经理 "请先评估这个功能的业务价值"
2. 等待产品经理回复
3. @技术顾问 "基于产品经理的评估，请分析实现难度"
4. 如此有序推进

这样的对话方式可以：
- 确保每个问题都得到充分关注
- 避免多人同时发言造成混乱
- 让讨论更有条理和效率`;
  },
  createMentionPattern
}; 