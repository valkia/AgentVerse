import { ProviderConfigs, ProviderType } from "@/types/ai";

// 默认配置
export const AI_PROVIDER_CONFIG: ProviderConfigs = {
  [ProviderType.DEEPSEEK]: {
    apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY,
    baseUrl:
      import.meta.env.VITE_DEEPSEEK_API_URL || "https://api.deepseek.com/v1",
    model: import.meta.env.VITE_DEEPSEEK_MODEL || "deepseek-chat",
    maxTokens: Number(import.meta.env.VITE_DEEPSEEK_MAX_TOKENS) || 1000,
  },

  [ProviderType.MOONSHOT]: {
    apiKey: import.meta.env.VITE_MOONSHOT_API_KEY,
    baseUrl:
      import.meta.env.VITE_MOONSHOT_API_URL || "https://api.moonshot.cn/v1",
    model: import.meta.env.VITE_MOONSHOT_MODEL || "moonshot-v1-8k",
    maxTokens: Number(import.meta.env.VITE_MOONSHOT_MAX_TOKENS) || 1000,
  },

  [ProviderType.DOBRAIN]: {
    apiKey: import.meta.env.VITE_DOBRAIN_API_KEY,
    baseUrl: import.meta.env.VITE_DOBRAIN_API_URL,
    model: import.meta.env.VITE_DOBRAIN_MODEL || "dobrain-v1",
    maxTokens: Number(import.meta.env.VITE_DOBRAIN_MAX_TOKENS) || 1000,
    topP: Number(import.meta.env.VITE_DOBRAIN_TOP_P) || 0.7,
    presencePenalty: Number(import.meta.env.VITE_DOBRAIN_PRESENCE_PENALTY) || 0,
    frequencyPenalty:
      Number(import.meta.env.VITE_DOBRAIN_FREQUENCY_PENALTY) || 0,
  },
  [ProviderType.OPENAI]: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    baseUrl: import.meta.env.VITE_OPENAI_API_URL || "https://api.openai.com/v1",
    model: import.meta.env.VITE_OPENAI_MODEL || "gpt-3.5-turbo",
    maxTokens: Number(import.meta.env.VITE_OPENAI_MAX_TOKENS) || 1000,
  },
};

export const AI_PROVIDER_TYPE = import.meta.env
  .VITE_AI_PROVIDER as ProviderType;

export const AI_USE_PROXY = import.meta.env.VITE_AI_USE_PROXY === "true";

export const AI_PROXY_URL = import.meta.env.VITE_AI_PROXY_URL;
