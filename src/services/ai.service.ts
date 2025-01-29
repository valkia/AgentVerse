import { Agent, Message as AgentMessage } from "@/types/agent";

// 基础类型定义
interface ChatMessage {
  role: string;
  content: string;
}

interface CompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// 基础配置接口
interface BaseProviderConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
}

// 豆包特有配置
interface DoBrainConfig extends BaseProviderConfig {
  topP?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
}

// Provider 接口
interface LLMProvider {
  generateCompletion(messages: ChatMessage[], temperature: number, maxTokens: number): Promise<string>;
  getConfig(): Partial<BaseProviderConfig>;
}

// DeepSeek Provider 实现
class DeepSeekProvider implements LLMProvider {
  private config: BaseProviderConfig;

  constructor(config: BaseProviderConfig) {
    this.config = {
      baseUrl: 'https://api.deepseek.com/v1',
      model: 'deepseek-chat',
      maxTokens: 1000,
      ...config
    };
  }

  getConfig(): Partial<BaseProviderConfig> {
    return this.config;
  }

  async generateCompletion(messages: ChatMessage[], temperature: number, maxTokens: number): Promise<string> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API request failed: ${response.statusText}`);
    }

    const data: CompletionResponse = await response.json();
    return data.choices[0].message.content;
  }
}

// Moonshot Provider 实现
class MoonshotProvider implements LLMProvider {
  private config: BaseProviderConfig;

  constructor(config: BaseProviderConfig) {
    this.config = {
      baseUrl: 'https://api.moonshot.cn/v1',
      model: 'moonshot-v1-8k',
      maxTokens: 1000,
      ...config
    };
  }

  getConfig(): Partial<BaseProviderConfig> {
    return this.config;
  }

  async generateCompletion(messages: ChatMessage[], temperature: number, maxTokens: number): Promise<string> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`Moonshot API request failed: ${response.statusText}`);
    }

    const data: CompletionResponse = await response.json();
    return data.choices[0].message.content;
  }
}

// DoBrain Provider 实现
class DoBrainProvider implements LLMProvider {
  private config: DoBrainConfig;

  constructor(config: DoBrainConfig) {
    this.config = {
      baseUrl: 'https://api.doubrain.com/api',
      model: 'dobrain-v1',
      maxTokens: 1000,
      topP: 0.7,
      presencePenalty: 0,
      frequencyPenalty: 0,
      ...config
    };
  }

  getConfig(): Partial<BaseProviderConfig> {
    return this.config;
  }

  async generateCompletion(messages: ChatMessage[], temperature: number, maxTokens: number): Promise<string> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature,
        max_tokens: maxTokens,
        top_p: this.config.topP,
        presence_penalty: this.config.presencePenalty,
        frequency_penalty: this.config.frequencyPenalty,
      }),
    });

    if (!response.ok) {
      throw new Error(`DoBrain API request failed: ${response.statusText}`);
    }

    const data: CompletionResponse = await response.json();
    return data.choices[0].message.content;
  }
}

// Provider 工厂
class LLMProviderFactory {
  private static providers: Record<string, typeof DeepSeekProvider | typeof MoonshotProvider | typeof DoBrainProvider> = {
    deepseek: DeepSeekProvider,
    moonshot: MoonshotProvider,
    dobrain: DoBrainProvider,
  };

  static registerProvider(name: string, provider: typeof DeepSeekProvider | typeof MoonshotProvider | typeof DoBrainProvider) {
    this.providers[name] = provider;
  }

  static createProvider(type: string, config: BaseProviderConfig | DoBrainConfig): LLMProvider {
    const Provider = this.providers[type];
    if (!Provider) {
      throw new Error(`Unknown provider type: ${type}`);
    }
    return new Provider(config);
  }

  static getAvailableProviders(): string[] {
    return Object.keys(this.providers);
  }
}

// AI Service 核心类
class AIService {
  private provider: LLMProvider;
  private static instance: AIService;

  private constructor(provider: LLMProvider) {
    this.provider = provider;
  }

  static getInstance(): AIService {
    if (!this.instance) {
      const defaultProvider = this.createDefaultProvider();
      this.instance = new AIService(defaultProvider);
    }
    return this.instance;
  }

  static createDefaultProvider(): LLMProvider {
    const defaultMaxTokens = 1000;
    const providerType = import.meta.env.VITE_AI_PROVIDER || 'deepseek';

    switch (providerType) {
      case 'moonshot':
        return LLMProviderFactory.createProvider('moonshot', {
          apiKey: import.meta.env.VITE_MOONSHOT_API_KEY,
          maxTokens: defaultMaxTokens,
        });
      case 'dobrain':
        return LLMProviderFactory.createProvider('dobrain', {
          apiKey: import.meta.env.VITE_DOBRAIN_API_KEY,
          maxTokens: defaultMaxTokens,
          topP: Number(import.meta.env.VITE_DOBRAIN_TOP_P) || 0.7,
          presencePenalty: Number(import.meta.env.VITE_DOBRAIN_PRESENCE_PENALTY) || 0,
          frequencyPenalty: Number(import.meta.env.VITE_DOBRAIN_FREQUENCY_PENALTY) || 0,
        });
      default:
        return LLMProviderFactory.createProvider('deepseek', {
          apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY,
          maxTokens: defaultMaxTokens,
        });
    }
  }

  // 提供切换 provider 的方法
  setProvider(type: string, config: BaseProviderConfig | DoBrainConfig) {
    this.provider = LLMProviderFactory.createProvider(type, config);
  }

  // 获取当前 provider 的配置
  getProviderConfig(): Partial<BaseProviderConfig> {
    return this.provider.getConfig();
  }

  private buildSystemPrompt(agent: Agent, topic: string): string {
    return `${agent.prompt}

讨论主题：${topic}

你的角色是：${agent.role}
性格特征：${agent.personality}
专业领域：${agent.expertise.join(', ')}
倾向性：${agent.bias}
回复风格：${agent.responseStyle}

请严格按照以上设定进行回复。保持角色特征的一致性，展现专业知识，同时体现个性化的观点。`;
  }

  private buildMessages(systemPrompt: string, messages: AgentMessage[], currentAgentId: string): ChatMessage[] {
    return [
      { role: "system", content: systemPrompt },
      ...messages.slice(-5).map(msg => ({
        role: msg.agentId === currentAgentId ? "assistant" : "user",
        content: msg.content
      }))
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
      return await this.provider.generateCompletion(messageList, temperature, this.provider.getConfig().maxTokens || 1000);
    } catch (error: unknown) {
      console.error('AI Service Error:', error);
      throw new Error(error instanceof Error ? error.message : '未知错误');
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

    return this.generateResponse(summaryPrompt, temperature, messages, moderator);
  }
}

// 导出单例实例
export const aiService = AIService.getInstance();

// 导出工厂类，允许注册新的 provider
export const providerFactory = LLMProviderFactory; 