import {
  AI_PROVIDER_CONFIG,
  AI_PROVIDER_TYPE,
  AI_PROXY_URL,
  AI_USE_PROXY,
} from "@/config/ai";
import {
  AIServiceError,
  ChatMessage,
  DirectAPIAdapter,
  LLMProvider,
  ProxyAPIAdapter,
  StandardProvider
} from "@/lib/ai-service";
import { Agent } from "@/types/agent";
import { Message as AgentMessage } from "@/types/discussion";
import { ProviderType } from "@/types/ai";

// 消息处理器接口
export interface MessageProcessor {
  process?(message: string): string;
  getSystemPrompt(): string;
}

// 字数限制处理器
export class WordLimitProcessor implements MessageProcessor {
  constructor(private readonly limit: number = 500) {}

  getSystemPrompt(): string {
    return `\n注意：每次回复请严格控制在${this.limit}字以内，超过部分将被截断。`;
  }
}

// 消息发送者处理器
export class MessageSenderProcessor implements MessageProcessor {
  constructor(private readonly members: Agent[]) {}

  getSystemPrompt(): string {
    return `\n注意：在对话中，你将看到其他参与者的发言。每个发言者的身份和角色如下：
${this.members.map(member => `- ${member.name}（${member.role}）：${member.expertise.join('、')}`).join('\n')}

请根据发言者的身份和专业领域来理解和回应他们的观点。`;
  }
}

// 核心服务类
export class AIService {
  private static readonly MAX_CONTEXT_MESSAGES = 5;
  private messageProcessors: MessageProcessor[] = [];
  private members: Agent[] = [];

  constructor(
    private readonly provider: LLMProvider,
    processors: MessageProcessor[] = [new WordLimitProcessor()]
  ) {
    this.messageProcessors = processors;
  }

  // 更新成员列表
  updateMembers(members: Agent[]) {
    this.members = members;
    // 更新或添加MessageSenderProcessor
    const senderProcessor = this.messageProcessors.find(p => p instanceof MessageSenderProcessor);
    if (senderProcessor) {
      this.messageProcessors = this.messageProcessors.map(p => 
        p instanceof MessageSenderProcessor ? new MessageSenderProcessor(members) : p
      );
    } else {
      this.messageProcessors.push(new MessageSenderProcessor(members));
    }
  }

  // 添加处理器
  addProcessor(processor: MessageProcessor) {
    this.messageProcessors.push(processor);
  }

  // 清除所有处理器
  clearProcessors() {
    this.messageProcessors = [];
  }

  private buildSystemPrompt(agent: Agent, topic: string): string {
    const basePrompt = `${agent.prompt}

目标：${topic}

你的角色是：${agent.role}
性格特征：${agent.personality}
专业领域：${agent.expertise.join(", ")}
倾向性：${agent.bias}
回复风格：${agent.responseStyle}

注意事项：
1. 请严格按照以上设定进行回复
2. 保持角色特征的一致性，展现专业知识，同时体现个性化的观点
3. 回复要简明扼要，直击重点`;

    // 添加所有处理器的系统提示
    const processorPrompts = this.messageProcessors
      .map(processor => processor.getSystemPrompt())
      .join("");

    return basePrompt + processorPrompts;
  }

  private buildMessages(
    systemPrompt: string,
    messages: AgentMessage[],
    currentAgentId: string
  ): ChatMessage[] {
    return [
      { role: "system", content: systemPrompt } as ChatMessage,
      ...messages.slice(-AIService.MAX_CONTEXT_MESSAGES).map(
        (msg) => {
          const sender = this.members.find(m => m.id === msg.agentId);
          const content = sender 
            ? `${sender.name}：${msg.content}`
            : msg.content;
          
          return {
            role: msg.agentId === currentAgentId ? "assistant" : "user",
            content,
          } as ChatMessage;
        }
      ),
    ];
  }

  async generateResponse(
    prompt: string,
    temperature: number,
    messages: AgentMessage[],
    agent: Agent
  ): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(agent, prompt);
      const messageList = this.buildMessages(systemPrompt, messages, agent.id);
      let response = await this.provider.generateCompletion(
        messageList,
        temperature,
      );

      // 应用所有处理器
      for (const processor of this.messageProcessors) {
        response = processor.process ? processor.process(response) : response;
      }

      return response;
    } catch (error) {
      console.error("AI Service Error:", error);
      throw error instanceof AIServiceError
        ? error
        : new AIServiceError("未知错误");
    }
  }

  async generateModeratorSummary(
    topic: string,
    temperature: number,
    messages: AgentMessage[],
    moderator: Agent
  ): Promise<string> {
    const summaryPrompt = `作为讨论主持人，请总结当前关于"${topic}"的讨论要点，并引导下一轮讨论。
要求：
1. 提炼各方观点的核心内容
2. 指出讨论中的共识和分歧
3. 提出下一步讨论的方向
4. 鼓励更深入的交流`;

    return this.generateResponse(
      summaryPrompt,
      temperature,
      messages,
      moderator
    );
  }
}

// 工厂函数
export function createAIService(): AIService {
  const useProxy = AI_USE_PROXY;
  const proxyUrl = AI_PROXY_URL;
  const providerType = AI_PROVIDER_TYPE as ProviderType;
  const providerConfig = AI_PROVIDER_CONFIG[providerType];

  const adapter = useProxy
    ? new ProxyAPIAdapter(proxyUrl)
    : new DirectAPIAdapter(providerConfig.apiKey, providerConfig.baseUrl);

  const provider = new StandardProvider(providerConfig, adapter, providerType);
  return new AIService(provider);
}

// 默认实例
export const aiService = createAIService();
