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
    description: "获取所有可用的Agent列表",
    execute: async () => {
      return agentListResource.read().data;
    },
  },
  {
    name: "getCurrentDiscussionMembers",
    description: "获取当前讨论的所有成员",
    execute: async () => {
      return discussionMembersResource.current.read().data;
    },
  },
  {
    name: "addMember",
    description: "添加成员到讨论中",
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
          isAutoReply: true,
        },
      ]);
      return discussionMembersResource.current.reload();
    },
  },
  {
    name: "removeMember",
    description: "从讨论中移除成员",
    execute: async ({ memberId }) => {
      await discussionMemberService.delete(memberId);
      return discussionMembersResource.current.reload();
    },
  },
  // {
  //   name: "requestAgentResponse",
  //   description: "请求指定Agent对当前话题进行回复",
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
  //   description: "获取当前讨论的历史消息",
  //   execute: async () => {
  //     return messagesResource.current.read().data;
  //   },
  // },
];

export const discussionCapabilitiesResource = createResource(() =>
  Promise.resolve(capabilities)
);
