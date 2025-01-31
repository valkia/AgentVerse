import { useObservableState } from "@/hooks/useObservableState";
import { discussionControlService } from "@/services/discussion-control.service";
import { useCallback, useEffect, useMemo } from "react";
import { useBeanState } from "rx-nested-bean";
import { useAgents } from "./useAgents";
import { useDiscussionMembers } from "./useDiscussionMembers";

export interface Member {
  agentId: string;
}

export function useMemberSelection(isFirstMessage: boolean = false) {
  const { agents } = useAgents();
  const { members } = useDiscussionMembers();
  const { data: currentDiscussionId } = useBeanState(
    discussionControlService.currentDiscussionIdBean
  );

  // 根据角色获取合适的成员
  const getDefaultMember = useCallback(() => {
    const role = isFirstMessage ? "moderator" : "participant";
    return (
      members.find((m) => {
        const agent = agents.find((a) => a.id === m.agentId);
        return agent?.role === role;
      }) || members[0]
    );
  }, [agents, isFirstMessage, members]);

  // 可用成员列表
  const availableMembers = useMemo(() => {
    if (isFirstMessage) {
      return members.filter(
        (m) => agents.find((a) => a.id === m.agentId)?.role === "moderator"
      );
    }
    return members;
  }, [agents, isFirstMessage, members]);

  // 选中的成员 ID 管理
  const [selectedMemberId, setSelectedMemberId] = useObservableState(
    () => getDefaultMember()?.agentId || ""
  );

  // 当前选中的 agent
  const selectedAgent = useMemo(
    () => agents.find((a) => a.id === selectedMemberId),
    [agents, selectedMemberId]
  );

  // 讨论变更或成员不存在时重置选择
  useEffect(() => {
    const shouldReset =
      !selectedMemberId ||
      !members.find((m) => m.agentId === selectedMemberId) ||
      currentDiscussionId;

    if (shouldReset) {
      const defaultMember = getDefaultMember();
      setSelectedMemberId(defaultMember?.agentId || "");
    }
  }, [
    currentDiscussionId,
    getDefaultMember,
    members,
    selectedMemberId,
    setSelectedMemberId,
  ]);

  return {
    selectedMemberId,
    setSelectedMemberId,
    selectedAgent,
    availableMembers,
    isSelectDisabled: isFirstMessage && selectedAgent?.role === "moderator",
  };
}
