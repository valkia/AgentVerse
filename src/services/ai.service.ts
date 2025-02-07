import {
  AI_PROVIDER_CONFIG,
  BasicAIConfig
} from "@/config/ai";
import {
  BaseConfig,
  ChatMessage,
  DirectAPIAdapter,
  LLMProvider,
  ProxyAPIAdapter,
  StandardProvider
} from "@/lib/ai-service";
import { SupportedAIProvider } from "@/types/ai";
import { Observable } from "rxjs";

// 核心服务类
export class AIService {
  constructor(private readonly provider: LLMProvider) {}

  configure(config: BaseConfig) {
    this.provider.configure(config);
  }

  public chatCompletion(messages: ChatMessage[]): Promise<string> {
    return this.provider.generateCompletion(messages);
  }

  public streamChatCompletion(messages: ChatMessage[]): Observable<string> {
    return this.provider.generateStreamCompletion(messages);
  }
}

// 工厂函数
export function createAIService(): AIService {
  const useProxy = BasicAIConfig.AI_USE_PROXY;
  const proxyUrl = BasicAIConfig.AI_PROXY_URL;
  const providerType = BasicAIConfig.AI_PROVIDER_NAME as SupportedAIProvider;
  const providerConfig = AI_PROVIDER_CONFIG[providerType];

  const adapter = useProxy
    ? new ProxyAPIAdapter(proxyUrl)
    : new DirectAPIAdapter(providerConfig.apiKey, providerConfig.baseUrl);

  const provider = new StandardProvider(providerConfig, adapter, providerType);
  return new AIService(provider);
}

// 默认实例
export const aiService = createAIService();
