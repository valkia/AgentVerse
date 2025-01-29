import { BaseConfig } from "@/lib/ai-service";

export enum ProviderType {
  DEEPSEEK = "deepseek",
  MOONSHOT = "moonshot",
  DOBRAIN = "dobrain",
  OPENAI = "openai",
}

export type ProviderConfigs = {
  [K in ProviderType]: BaseConfig;
};
