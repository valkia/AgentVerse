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
import { Agent, Message as AgentMessage } from "@/types/agent";
import { ProviderType } from "@/types/ai";

// 核心服务类
class AIService {
  private static readonly MAX_CONTEXT_MESSAGES = 5;
  private static readonly DEFAULT_MAX_TOKENS = 1000;

  constructor(private readonly provider: LLMProvider) {}

  private buildSystemPrompt(agent: Agent, topic: string): string {
    return `${agent.prompt}

讨论主题：${topic}

你的角色是：${agent.role}
性格特征：${agent.personality}
专业领域：${agent.expertise.join(", ")}
倾向性：${agent.bias}
回复风格：${agent.responseStyle}

请严格按照以上设定进行回复。保持角色特征的一致性，展现专业知识，同时体现个性化的观点。`;
  }

  private buildMessages(
    systemPrompt: string,
    messages: AgentMessage[],
    currentAgentId: string
  ): ChatMessage[] {
    return [
      { role: "system", content: systemPrompt } as ChatMessage,
      ...messages.slice(-AIService.MAX_CONTEXT_MESSAGES).map(
        (msg) =>
          ({
            role: msg.agentId === currentAgentId ? "assistant" : "user",
            content: msg.content,
          } as ChatMessage)
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
      return await this.provider.generateCompletion(
        messageList,
        temperature,
      );
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
