import { MockHttpProvider } from "@/lib/storage";
import { DiscussionMember } from "@/types/discussion-member";
import { DiscussionMemberDataProvider } from "@/types/storage";
import { STORAGE_CONFIG } from "@/config/storage";
import { nanoid } from "nanoid";

export class DiscussionMemberService {
  constructor(private provider: DiscussionMemberDataProvider) {}

  async list(discussionId: string): Promise<DiscussionMember[]> {
    const members = await this.provider.list();
    return members.filter((member) => member.discussionId === discussionId);
  }

  async create(
    discussionId: string,
    agentId: string,
    isAutoReply: boolean = false
  ): Promise<DiscussionMember> {
    const member: DiscussionMember = {
      id: nanoid(),
      discussionId,
      agentId,
      isAutoReply,
      joinedAt: new Date().toISOString(),
    };
    return this.provider.create(member);
  }

  async createMany(
    discussionId: string,
    members: { agentId: string; isAutoReply: boolean }[]
  ): Promise<DiscussionMember[]> {
    const memberData = members.map(member => ({
      discussionId,
      agentId: member.agentId,
      isAutoReply: member.isAutoReply,
      joinedAt: new Date().toISOString(),
    }));
    return this.provider.createMany(memberData);
  }

  async update(
    memberId: string,
    data: Partial<DiscussionMember>
  ): Promise<DiscussionMember> {
    return this.provider.update(memberId, data);
  }

  async delete(memberId: string): Promise<void> {
    return this.provider.delete(memberId);
  }
}

export const discussionMemberService = new DiscussionMemberService(
  new MockHttpProvider<DiscussionMember>(STORAGE_CONFIG.KEYS.DISCUSSION_MEMBERS, STORAGE_CONFIG.MOCK_DELAY_MS)
);
