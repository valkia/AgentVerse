import { Capability } from "@/lib/capabilities";
import { createResource } from "@/lib/resource";
import { eventBus } from "@/core/env";
import { USER_SELECT } from "@/core/events";
import {
  agentListResource,
  discussionMembersResource
} from "@/resources";
import { agentService } from "@/services/agent.service";
import { discussionControlService } from "@/services/discussion-control.service";
import { discussionMemberService } from "@/services/discussion-member.service";

const capabilities: Capability[] = [
  {
    name: "getAvailableAgents",
    description: `
获取所有可用的Agent列表
---
输入参数：
  无

返回值：
  type: array
  items:
    type: object
    properties:
      id: string - Agent唯一标识符
      name: string - Agent名称
      avatar: string - Agent头像URL
      role: string - Agent角色，可选值：'moderator' | 'participant'
      personality: string - Agent性格特征
      expertise: array<string> - Agent专长领域
`,
    execute: async () => {
      return agentListResource.read().data;
    },
  },
  {
    name: "createAgent",
    description: `
创建一个新的Agent成员。你可以通过这个能力创建一个新的AI助手，指定其专业领域、性格特征和行为方式。

输入参数：
  name: string - Agent的名称，例如："产品经理"
  role: string - 角色类型，必须是 'moderator'(主持人) 或 'participant'(参与者)
  personality: string - 性格特征描述，例如："严谨理性、善于分析"
  expertise: string[] - 专业领域列表，例如：["产品设计", "用户体验", "市场分析"]
  prompt: string - 对Agent的行为指导，用于定义其在对话中的表现
  avatar: string? - （可选）头像URL，使用 DiceBear Bottts 风格，格式为："https://api.dicebear.com/7.x/bottts/svg?seed={关键词}"，例如："https://api.dicebear.com/7.x/bottts/svg?seed=product-manager"。不提供时会自动生成
  bias: string? - （可选）偏好倾向，例如："注重用户体验"
  responseStyle: string? - （可选）回复风格，例如："专业严谨"

示例参数：
  {
    "name": "产品经理",
    "role": "participant",
    "personality": "严谨理性、善于分析",
    "expertise": ["产品设计", "用户体验", "市场分析"],
    "prompt": "你是一位经验丰富的产品经理，擅长分析用户需求和市场趋势。在讨论中，你应该：\\n1. 关注用户价值\\n2. 考虑市场可行性\\n3. 平衡各方需求\\n4. 提供可执行的建议"
  }`,
    execute: async (params) => {
      // 验证必填字段
      const requiredFields = ['name', 'role', 'personality', 'expertise', 'prompt'];
      for (const field of requiredFields) {
        if (!params[field]) {
          throw new Error(`${field} is required`);
        }
      }

      // 验证role的值
      if (!['moderator', 'participant'].includes(params.role)) {
        throw new Error('Invalid role value');
      }

      // 生成默认头像
      if (!params.avatar) {
        const seed = Date.now().toString();
        params.avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=b6e3f4,c7f2a4,f4d4d4`;
      }

      try {
        // 创建Agent
        const agent = await agentService.createAgent({
          name: params.name,
          role: params.role,
          personality: params.personality,
          expertise: params.expertise,
          prompt: params.prompt,
          avatar: params.avatar,
          bias: params.bias || '待设置',
          responseStyle: params.responseStyle || '待设置'
        });

        // 重新加载Agent列表资源
        await agentListResource.reload();
        return agent;
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`创建Agent失败: ${error.message}`);
        }
        throw error;
      }
    },
  },
  {
    name: "getCurrentDiscussionMembers",
    description: `
获取当前讨论的所有成员
---
输入参数：
  无

返回值：
  type: array
  items:
    type: object
    properties:
      id: string - 成员ID
      agentId: string - 关联的Agent ID
      agentName: string - Agent名称
      isAutoReply: boolean - 是否自动回复
`,
    execute: async () => {
      const members = discussionMembersResource.current.read().data;
      const agents = agentListResource.read().data;
      
      return members.map(member => ({
        ...member,
        agentName: agents.find(agent => agent.id === member.agentId)?.name || '未知'
      }));
    },
  },
  {
    name: "addMember",
    description: `
添加成员到讨论中
---
输入参数：
  type: object
  required: true
  properties:
    agentId:
      type: string
      description: 要添加的Agent的ID
      required: true

返回值：
  type: array
  description: 更新后的成员列表
  items:
    type: object
    properties:
      id: string - 成员ID
      agentId: string - 关联的Agent ID
      isAutoReply: boolean - 是否自动回复
`,
    execute: async ({ agentId }) => {
      const discussionId = discussionControlService.getCurrentDiscussionId();
      if (!discussionId) return null;
      const agent = await agentService.getAgent(agentId);
      if (!agent) {
        throw new Error("Agent not found");
      }
      await discussionMemberService.createMany(discussionId, [
        {
          agentId,
          isAutoReply: false,
        },
      ]);
      return discussionMembersResource.current.reload();
    },
  },
  {
    name: "removeMember",
    description: `
从讨论中移除成员
---
输入参数：
  type: object
  required: true
  properties:
    memberId:
      type: string
      description: 要移除的成员ID
      required: true

返回值：
  type: array
  description: 更新后的成员列表
  items:
    type: object
    properties:
      id: string - 成员ID
      agentId: string - 关联的Agent ID
      isAutoReply: boolean - 是否自动回复
`,
    execute: async ({ memberId }) => {
      console.log("[Capabilities] memberId:", memberId);
      await discussionMemberService.delete(memberId);
      return discussionMembersResource.current.reload();
    },
  },
  {
    name: "askUserToChoose",
    description: `
向用户展示选项并获取其选择。

使用场景：
1. 需要用户在多个选项中做出选择
2. 收集用户对某个问题的具体偏好
3. 引导用户完成分步骤的决策过程

输入参数：
  options: 选项列表，每个选项包含：
    - value: 选项值
    - label: 显示文本
    - description: 选项描述（可选）
  multiple: 是否允许多选（默认false）
  defaultValue: 默认选中的值（仅在 multiple=true 时可用，单选模式下不应该提供此参数）

返回值：
  selected: 用户选择的值（单选为string，多选为string[]）

注意：
- 单选模式下不要提供 defaultValue 参数，让用户主动做出选择
- 多选模式下可以提供 defaultValue 来预选某些选项

示例：
:::action
{
  "capability": "askUserToChoose",
  "description": "请选择开发框架",
  "params": {
    "options": [
      {
        "value": "next",
        "label": "Next.js",
        "description": "React全栈框架"
      }
    ]
  }
}
:::
`,
    execute: async (params) => {
      // 验证参数
      if (!Array.isArray(params.options) || params.options.length === 0) {
        throw new Error("选项列表不能为空");
      }

      // 等待用户选择事件
      return new Promise((resolve, reject) => {
        const handleUserSelect = (event: { operationId: string; selected: string | string[] }) => {
          // 移除事件监听
          eventBus.off(USER_SELECT, handleUserSelect);
          resolve({ selected: event.selected });
        };

        // 添加事件监听
        eventBus.on(USER_SELECT, handleUserSelect);

        // 设置超时（可选）
        setTimeout(() => {
          eventBus.off(USER_SELECT, handleUserSelect);
          reject(new Error("用户选择超时"));
        }, 5 * 60 * 1000); // 5分钟超时
      });
    },
  },
];

export const discussionCapabilitiesResource = createResource(() =>
  Promise.resolve(capabilities)
);

