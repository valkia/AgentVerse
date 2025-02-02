import { ChatMessage } from ".";
import { Agent } from "@/types/agent";
import { AgentMessage } from "@/types/discussion";

export interface ConvertMessagesOptions {
  systemPrompt: string;
  messages: AgentMessage[];
  currentAgentId: string;
  maxContextMessages: number;
  members: Agent[];
}

export class MessageConverter {
  /**
   * 将系统消息和代理消息转换为聊天消息
   */
  toChatMessages(options: ConvertMessagesOptions): ChatMessage[] {
    const {
      systemPrompt,
      messages,
      currentAgentId,
      maxContextMessages,
      members,
    } = options;
    return [
      this.createSystemMessage(systemPrompt),
      ...this.convertAgentMessages({
        messages,
        currentAgentId,
        maxContextMessages,
        members,
      }),
    ];
  }

  /**
   * 创建系统消息
   */
  private createSystemMessage(content: string): ChatMessage {
    return { role: "system", content };
  }

  /**
   * 转换代理消息列表
   */
  convertAgentMessages(
    options: Omit<ConvertMessagesOptions, "systemPrompt">
  ): ChatMessage[] {
    const { messages, currentAgentId, maxContextMessages, members } = options;
    return messages
      .slice(-maxContextMessages)
      .map((msg) =>
        this.convertAgentMessage({ message: msg, currentAgentId, members })
      );
  }

  /**
   * 转换单个代理消息
   */
  private convertAgentMessage(options: {
    message: AgentMessage;
    currentAgentId: string;
    members: Agent[];
  }): ChatMessage {
    const { message, currentAgentId, members } = options;
    const sender = members.find((m) => m.id === message.agentId);
    const content = sender
      ? `${sender.name}：${message.content}`
      : message.content;

    return {
      role: message.agentId === currentAgentId ? "assistant" : "user",
      content,
    };
  }
}
