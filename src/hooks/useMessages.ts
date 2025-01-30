import { Message } from "@/types/discussion";
import { messagesResource } from "@/resources";
import { messageService } from "@/services/message.service";
import { useResourceState } from "@/lib/resource";
import { useMemoizedFn } from "ahooks";
import { discussionControlService } from "@/services/discussion-control.service";
import { useProxyBeanState } from "packages/rx-nested-bean/src";

export function useMessages() {
  const resourceState = useResourceState(messagesResource.current);
  const { data: currentDiscussionId } = useProxyBeanState(
    discussionControlService.store,
    "currentDiscussionId"
  );

  const addMessage = useMemoizedFn(
    async (
      content: string,
      agentId: string,
      type: Message["type"] = "text"
    ) => {
      if (!currentDiscussionId) return;

      const message = await messageService.addMessage(currentDiscussionId, {
        content,
        agentId,
        type,
        timestamp: new Date(),
      });

      // 触发消息列表重新加载
      messagesResource.current.reload();
      return message;
    }
  );

  return {
    messages: resourceState.data,
    isLoading: resourceState.isLoading,
    error: resourceState.error,
    addMessage,
  };
}
