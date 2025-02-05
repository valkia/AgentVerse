import { Capability } from "@/lib/capabilities";
import { createResource } from "@/lib/resource";
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
  // {
  //   name: "requestAgentResponse",
  //   description: `
  // 请求指定Agent对当前话题进行回复
  // ---
  // 输入参数：
  //   type: object
  //   required: true
  //   properties:
  //     agentId:
  //       type: string
  //       description: 要请求回复的Agent ID
  //       required: true
  //     message:
  //       type: string
  //       description: 要回复的消息内容
  //       required: true
  // 
  // 返回值：
  //   type: boolean
  //   description: 请求是否成功
  // `,
  //   execute: async ({
  //     agentId,
  //     // message,
  //   }: {
  //     agentId: string;
  //     message: string;
  //   }) => {
  //     const agent = discussionControlService.getAgent(agentId);
  //     if (!agent) return null;
  //     // 通过事件系统触发消息
  //     // discussionControlService.onRequestSendMessage$.next({
  //     //   agentId,
  //     //   content: message,
  //     //   type: "text",
  //     // });
  //     return true;
  //   },
  // },
  // {
  //   name: "getDiscussionHistory",
  //   description: `
  // 获取当前讨论的历史消息
  // ---
  // 输入参数：
  //   无
  // 
  // 返回值：
  //   type: array
  //   items:
  //     type: object
  //     properties:
  //       id: string - 消息ID
  //       content: string - 消息内容
  //       type: string - 消息类型
  //       senderId: string - 发送者ID
  //       timestamp: string - 发送时间
  // `,
  //   execute: async () => {
  //     return messagesResource.current.read().data;
  //   },
  // },
];

export const discussionCapabilitiesResource = createResource(() =>
  Promise.resolve(capabilities)
);
