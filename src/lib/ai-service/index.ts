import OpenAI from "openai";
import { APIError } from "openai/error";
import {
  ChatCompletionCreateParams,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
export * from './message-converter';

// 错误类
export class AIServiceError extends Error {
  constructor(message: string, public code?: string, public type?: string) {
    super(message);
    this.name = "AIServiceError";
  }
}

// 核心类型
export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

// 核心接口
export interface BaseConfig {
  apiKey: string;
  baseUrl?: string;
  model: string; // 改为必需
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
}

export interface APIAdapter {
  makeRequest(params: AIRequestParams): Promise<string>;
}

export interface AIRequestParams {
  messages: ChatMessage[];
  model: string; // 改为必需
  temperature?: number;
  maxTokens?: number;
  [key: string]: unknown;
}

export interface LLMProvider {
  generateCompletion(
    messages: ChatMessage[],
    temperature?: number,
    maxTokens?: number
  ): Promise<string>;
}

// Provider 参数接口
export interface ProviderParams {
  provider: string;
  model: string;
  [key: string]: unknown;
}

// Provider 抽象基类
export abstract class BaseLLMProvider implements LLMProvider {
  constructor(
    protected readonly config: BaseConfig,
    protected readonly adapter: APIAdapter
  ) {
    this.validateConfig(config);
  }

  protected validateConfig(config: BaseConfig): void {
    if (!config.apiKey) {
      throw new AIServiceError("Missing API key");
    }
    if (!config.model) {
      throw new AIServiceError("Missing model");
    }
  }

  protected abstract getProviderParams(): ProviderParams;

  async generateCompletion(
    messages: ChatMessage[],
    temperature?: number,
    maxTokens?: number
  ): Promise<string> {
    const { model, ...providerParams } = this.getProviderParams();
    return this.adapter.makeRequest({
      messages,
      temperature: temperature || this.config.temperature,
      maxTokens: maxTokens || this.config.maxTokens,
      model,
      ...providerParams,
    });
  }
}

// 通用适配器实现
export class DirectAPIAdapter implements APIAdapter {
  private client: OpenAI;

  constructor(apiKey: string, baseURL?: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL,
      dangerouslyAllowBrowser: true,
    });
  }

  async makeRequest(params: AIRequestParams): Promise<string> {
    try {
      const { messages, temperature, maxTokens, model } = params;
      const completion = await this.client.chat.completions.create({
        messages: messages as ChatCompletionMessageParam[],
        temperature,
        max_tokens: maxTokens,
        model,
        stream: false,
      } as ChatCompletionCreateParams);

      if (!("choices" in completion)) {
        throw new AIServiceError("Invalid response format");
      }

      return completion.choices[0]?.message?.content || "";
    } catch (error) {
      throw new AIServiceError(
        error instanceof Error ? error.message : "API request failed",
        (error as APIError)?.code || undefined,
        (error as APIError)?.type || undefined
      );
    }
  }
}

export class ProxyAPIAdapter implements APIAdapter {
  constructor(private baseURL: string) {}

  async makeRequest(params: AIRequestParams): Promise<string> {
    try {
      const response = await fetch(`${this.baseURL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new AIServiceError(error.error, error.code, error.type);
      }

      const data = await response.json();
      return data.choices[0].message.content || "";
    } catch (error) {
      if (error instanceof AIServiceError) throw error;
      throw new AIServiceError(
        error instanceof Error ? error.message : "API request failed"
      );
    }
  }
}

// 通用 Provider 实现
export class StandardProvider extends BaseLLMProvider {
  constructor(
    protected readonly config: BaseConfig,
    protected readonly adapter: APIAdapter,
    private readonly providerType: string
  ) {
    super(config, adapter);
  }

  public getProviderParams(): ProviderParams {
    return {
      provider: this.providerType,
      model: this.config.model,
    };
  }
}
