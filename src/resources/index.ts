import { DEFAULT_AGENTS } from "@/config/agents";
import { createResource } from "@/lib/resource";
import { agentService } from "@/services/agent.service";
import { discussionControlService } from "@/services/discussion-control.service";
import { discussionService } from "@/services/discussion.service";
import { messageService } from "@/services/message.service";
import { Discussion } from "@/types/discussion";
import { discussionMemberService } from "@/services/discussion-member.service";
import { DiscussionMember } from "@/types/discussion-member";

// 应用级资源
export const agentListResource = createResource(() =>
  agentService.listAgents().then((agents) => {
    if (agents.length === 0) {
      return Promise.all(
        DEFAULT_AGENTS.map((agent) => agentService.createAgent(agent))
      );
    }
    return agents;
  })
);

// 按领域组织资源
export const agentsResource = {
  // 主列表资源
  list: agentListResource,
};

// 会话管理资源
export const discussionsResource = {
  // 会话列表
  list: createResource<Discussion[]>(
    () => discussionService.listDiscussions(),
    {
      onCreated: (resource) => {
        resource.subscribe((state) => {
          // 如果有会话列表，但当前没有选中的会话，则自动选择第一个
          if (
            state.data?.length &&
            !discussionControlService.getCurrentDiscussionId()
          ) {
            discussionControlService.setCurrentDiscussionId(state.data[0].id);
          }
        });
      },
    }
  ),

  // 当前会话
  current: createResource(
    async () => {
      const currentId = discussionControlService.getCurrentDiscussionId();
      if (!currentId) return null;
      return discussionService.getDiscussion(currentId);
    },
    {
      onCreated: (resource) => {
        discussionControlService.onCurrentDiscussionIdChange$.listen(() => {
          resource.reload();
        });
      },
    }
  ),
};

export const discussionMembersResource = {
  current: createResource<DiscussionMember[]>(
    async () => {
      const discussionId = discussionControlService.getCurrentDiscussionId();
      if (!discussionId) return [];
      return discussionMemberService.list(discussionId);
    },
    {
      onCreated: (resource) => {
        return discussionControlService.onCurrentDiscussionIdChange$.listen(() => {
          resource.reload();
        });
      },
    }
  ),
};

// 消息管理资源
export const messagesResource = {
  // 当前会话的消息列表
  current: createResource(
    () => {
      const currentId = discussionControlService.getCurrentDiscussionId();
      if (!currentId) return Promise.resolve([]);
      return messageService.listMessages(currentId);
    },
    {
      onCreated: (resource) => {
        discussionControlService.onCurrentDiscussionIdChange$.listen(
          async () => {
            await resource.reload();
          }
        );
      },
    }
  ),
};
