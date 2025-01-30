import { discussionMembersResource } from "@/resources";
import { discussionMemberService } from "@/services/discussion-member.service";
import { DiscussionMember } from "@/types/discussion-member";
import { useMemoizedFn } from "ahooks";
import { useResourceState } from "@/lib/resource";
import { discussionControlService } from "@/services/discussion-control.service";
import { useCallback } from "react";

interface UseDiscussionMembersProps {
  onChange?: (members: DiscussionMember[]) => void;
}

export function useDiscussionMembers({ onChange }: UseDiscussionMembersProps = {}) {
  const resource = useResourceState(discussionMembersResource.current);
  const { data: members = [] } = resource;

  const getMembersForDiscussion = useCallback((discussionId: string) => {
    return discussionMemberService.list(discussionId);
  }, []);

  const addMember = useMemoizedFn(async (agentId: string, isAutoReply: boolean = false) => {
    const discussionId = discussionControlService.getCurrentDiscussionId();
    if (!discussionId) return;

    const member = await discussionMemberService.create(discussionId, agentId, isAutoReply);
    discussionMembersResource.current.reload();
    onChange?.(members);
    return member;
  });

  const updateMember = useMemoizedFn(async (memberId: string, data: Partial<DiscussionMember>) => {
    const member = await discussionMemberService.update(memberId, data);
    discussionMembersResource.current.reload();
    onChange?.(members);
    return member;
  });

  const removeMember = useMemoizedFn(async (memberId: string) => {
    await discussionMemberService.delete(memberId);
    discussionMembersResource.current.reload();
    onChange?.(members);
  });

  const toggleAutoReply = useMemoizedFn(async (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    return updateMember(memberId, { isAutoReply: !member.isAutoReply });
  });

  return {
    members,
    isLoading: resource.isLoading,
    error: resource.error,
    addMember,
    updateMember,
    removeMember,
    toggleAutoReply,
    getMembersForDiscussion
  };
} 