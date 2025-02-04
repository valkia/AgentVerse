import {
  AI_PROVIDER_CONFIG,
  AI_PROVIDER_TYPE,
  AI_PROXY_URL,
  AI_USE_PROXY,
} from "@/config/ai";
import {
  ChatMessage,
  DirectAPIAdapter,
  LLMProvider,
  ProxyAPIAdapter,
  StandardProvider
} from "@/lib/ai-service";
import { ProviderType } from "@/types/ai";

// 核心服务类
export class AIService {
  constructor(private readonly provider: LLMProvider) {}

  public chatCompletion(messages: ChatMessage[]): Promise<string> {
    return this.provider.generateCompletion(messages);
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
