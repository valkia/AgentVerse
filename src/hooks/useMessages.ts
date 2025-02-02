import { AgentMessage } from "@/types/discussion";
import { messagesResource } from "@/resources";
import { messageService } from "@/services/message.service";
import { useResourceState } from "@/lib/resource";
import { useMemoizedFn } from "ahooks";
import { discussionControlService } from "@/services/discussion-control.service";
import { useProxyBeanState } from "packages/rx-nested-bean/src";
import { useOptimisticUpdate } from "./useOptimisticUpdate";
import { nanoid } from "nanoid";

export function useMessages() {
  const resourceState = useResourceState(messagesResource.current);
  const { data: currentDiscussionId } = useProxyBeanState(
    discussionControlService.store,
    "currentDiscussionId"
  );
  
  const withOptimisticUpdate = useOptimisticUpdate(resourceState);

  const addMessage = useMemoizedFn(
    async (
      content: string,
      agentId: string,
      type: AgentMessage["type"] = "text"
    ) => {
      if (!currentDiscussionId) return;

      const tempId = nanoid();
      const timestamp = new Date();

      return withOptimisticUpdate(
        // 乐观更新
        (messages) => [
          ...messages,
          {
            id: tempId,
            content,
            agentId,
            type,
            timestamp,
            discussionId: currentDiscussionId,
          },
        ],
        // API 调用
        () =>
          messageService.addMessage(currentDiscussionId, {
            content,
            agentId,
            type,
            timestamp,
          })
      );
    }
  );

  return {
    messages: resourceState.data,
    isLoading: resourceState.isLoading,
    error: resourceState.error,
    addMessage,
  };
}
