import { config as dotenvConfig } from "dotenv";

dotenvConfig();

export const config = {
  // API Keys - required for each provider you want to use
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || "",
  kimiApiKey: process.env.KIMI_API_KEY || "",
  openrouterApiKey: process.env.OPENROUTER_API_KEY || "",

  // OpenRouter specific: force a specific provider (optional)
  openrouterProvider: process.env.OPENROUTER_PROVIDER || undefined,

  // Default values (used as fallbacks if not specified in request)
  provider: process.env.AI_PROVIDER || "deepseek",
  models: {
    anthropic: "claude-sonnet-4-5",
    openai: "gpt-4-turbo",
    deepseek: "deepseek-reasoner",
    kimi: "moonshot-v1-128k",
    openrouter: "moonshotai/kimi-k2.5",
  },

  // Default analysis settings (fallbacks)
  maxTokensResposta: 16000,
  temperature: 0.3,
  thinkingBudgets: {
    fase1: 15000,
    fase2: 12000,
    fase3: 10000,
    fase4: 15000,
  },

  // Features
  enableTools: true,
  enableThinking: true,
};

export function validateConfig(): void {
  const hasAnyKey =
    config.anthropicApiKey ||
    config.openaiApiKey ||
    config.deepseekApiKey ||
    config.kimiApiKey ||
    config.openrouterApiKey;

  if (!hasAnyKey) {
    console.warn("Warning: No API keys configured. Set at least one provider key in .env");
  }

  console.log("Configuration loaded:");
  console.log("  Anthropic:", config.anthropicApiKey ? "configured" : "not set");
  console.log("  OpenAI:", config.openaiApiKey ? "configured" : "not set");
  console.log("  DeepSeek:", config.deepseekApiKey ? "configured" : "not set");
  console.log("  OpenRouter:", config.openrouterApiKey ? "configured" : "not set");
}
