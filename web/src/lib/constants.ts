// ============ AI PROVIDERS ============

export interface ModelConfig {
  id: string;
  name: string;
  reasoning: boolean;
}

export interface ProviderConfig {
  name: string;
  models: ModelConfig[];
  icon: string;
  color: string;
}

export const PROVIDERS: Record<string, ProviderConfig> = {
  deepseek: {
    name: "DeepSeek",
    models: [
      { id: "deepseek-reasoner", name: "DeepSeek R1 (Reasoner)", reasoning: true },
      { id: "deepseek-chat", name: "DeepSeek v3", reasoning: false },
    ],
    icon: "🧠",
    color: "blue",
  },
  openai: {
    name: "OpenAI",
    models: [
      { id: "gpt-4-turbo", name: "GPT-4 Turbo", reasoning: false },
      { id: "gpt-4", name: "GPT-4", reasoning: false },
      { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", reasoning: false },
    ],
    icon: "🤖",
    color: "green",
  },
  anthropic: {
    name: "Anthropic",
    models: [
      { id: "claude-opus-4-5", name: "Claude Opus 4.5", reasoning: false },
      { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5", reasoning: false },
    ],
    icon: "🎭",
    color: "purple",
  },
  openrouter: {
    name: "OpenRouter",
    models: [
      { id: "moonshotai/kimi-k2.5", name: "Kimi K2.5", reasoning: true },
      { id: "google/gemini-2.0-flash-exp", name: "Gemini 2.0 Flash", reasoning: false },
      { id: "qwen/qwen-2.5-72b-instruct", name: "Qwen 2.5 72B", reasoning: false },
    ],
    icon: "🌐",
    color: "orange",
  },
};

/** Get provider display name */
export function getProviderName(providerId: string): string {
  return PROVIDERS[providerId]?.name || providerId;
}

/** Get model display name with provider */
export function getModelDisplayName(providerId: string, modelId: string): string {
  const provider = PROVIDERS[providerId];
  if (!provider) return `${providerId} / ${modelId}`;

  const model = provider.models.find((m) => m.id === modelId);
  return `${provider.name} / ${model?.name || modelId}`;
}

/** Get provider config by id */
export function getProvider(providerId: string): ProviderConfig | undefined {
  return PROVIDERS[providerId];
}

/** Get all provider ids */
export function getProviderIds(): string[] {
  return Object.keys(PROVIDERS);
}

// ============ DEFAULT CONFIG ============

export const DEFAULT_ANALYSIS_CONFIG = {
  provider: "openrouter",
  model: "moonshotai/kimi-k2.5",
  temperature: 0.3,
  maxTokens: 16000,
  enableThinking: true,
  thinkingBudget: 5000,
} as const;
