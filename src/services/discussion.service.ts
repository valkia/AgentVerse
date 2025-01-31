import { MockHttpProvider } from "@/lib/storage";
import { Discussion } from "@/types/discussion";
import { DiscussionDataProvider } from "@/types/storage";
import { STORAGE_CONFIG } from "@/config/storage";

export class DiscussionService {
  constructor(private provider: DiscussionDataProvider) {}

  async listDiscussions(): Promise<Discussion[]> {
    return this.provider.list();
  }

  async getDiscussion(id: string): Promise<Discussion> {
    return this.provider.get(id);
  }

  async createDiscussion(title: string): Promise<Discussion> {
    const discussion: Omit<Discussion, "id"> = {
      title,
      topic: "",
      status: "paused",
      settings: {
        maxRounds: 10,
        temperature: 0.7,
        interval: 3000,
        moderationStyle: "relaxed",
        focusTopics: [],
        allowConflict: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.provider.create(discussion);
  }

  async updateDiscussion(
    id: string,
    data: Partial<Discussion>
  ): Promise<Discussion> {
    return this.provider.update(id, data);
  }

  async deleteDiscussion(id: string): Promise<void> {
    return this.provider.delete(id);
  }
}

// 创建服务实例
export const discussionService = new DiscussionService(
  new MockHttpProvider<Discussion>(STORAGE_CONFIG.KEYS.DISCUSSIONS, STORAGE_CONFIG.MOCK_DELAY_MS)
);
