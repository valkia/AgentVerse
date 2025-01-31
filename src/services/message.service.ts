import { Message } from "@/types/discussion";
import { MockHttpProvider } from "@/lib/storage";
import { MessageDataProvider } from "@/types/storage";
import { STORAGE_CONFIG } from "@/config/storage";

export class MessageService {
  constructor(private readonly provider: MessageDataProvider) {}

  async listMessages(discussionId: string): Promise<Message[]> {
    const messages = await this.provider.list();
    return messages
      .filter(msg => msg.discussionId === discussionId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async getMessage(id: string): Promise<Message> {
    return this.provider.get(id);
  }

  async addMessage(discussionId: string, message: Omit<Message, "id" | "discussionId">): Promise<Message> {
    const newMessage: Omit<Message, "id"> = {
      ...message,
      discussionId,
      timestamp: new Date(),
    };

    return this.provider.create(newMessage);
  }

  async createMessage(data: Omit<Message, "id">): Promise<Message> {
    return this.provider.create(data);
  }

  async updateMessage(id: string, data: Partial<Message>): Promise<Message> {
    return this.provider.update(id, data);
  }

  async deleteMessage(id: string): Promise<void> {
    return this.provider.delete(id);
  }

  async clearMessages(discussionId: string): Promise<void> {
    const messages = await this.listMessages(discussionId);
    await Promise.all(messages.map(message => this.deleteMessage(message.id)));
  }
}

// 创建服务实例
export const messageService = new MessageService(
  new MockHttpProvider<Message>(STORAGE_CONFIG.KEYS.MESSAGES, STORAGE_CONFIG.MOCK_DELAY_MS)
); 