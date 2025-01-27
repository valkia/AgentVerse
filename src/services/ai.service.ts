import { Agent, Message } from "@/types/agent";

interface AIServiceConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
}

class AIService {
  private config: AIServiceConfig;

  constructor(config: Partial<AIServiceConfig> = {}) {
    this.config = {
      apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY,
      baseUrl: 'https://api.deepseek.com/v1',
      model: 'deepseek-chat',
      maxTokens: 1000,
      ...config
    };
  }

  private async makeRequest(endpoint: string, data: any) {
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
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

  private buildMessages(systemPrompt: string, messages: Message[], currentAgentId: string) {
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
    messages: Message[],
    agent: Agent
  ): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(agent, prompt);
      const messageList = this.buildMessages(systemPrompt, messages, agent.id);

      const data = await this.makeRequest('/chat/completions', {
        model: this.config.model,
        messages: messageList,
        temperature,
        max_tokens: this.config.maxTokens,
      });

      return data.choices[0].message.content;
    } catch (error: unknown) {
      console.error('AI Service Error:', error);
      throw new Error(error instanceof Error ? error.message : '未知错误');
    }
  }

  async generateModeratorSummary(
    topic: string,
    temperature: number,
    messages: Message[],
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
export const aiService = new AIService(); 