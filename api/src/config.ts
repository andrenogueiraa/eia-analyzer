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
  provider: process.env.AI_PROVIDER || "openrouter",
  models: {
    anthropic: "claude-sonnet-4-5-20250514",
    openai: "gpt-5.2",
    google: "gemini-3-pro-preview",
    deepseek: "deepseek-chat",
    zhipu: "glm-4-0520",
    moonshot: "moonshot-v1-128k",
    openrouter: "moonshotai/kimi-k2.5", // Kimi K2.5 default
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

  // Convex (for dynamic pricing)
  convexSiteUrl: process.env.VITE_CONVEX_SITE_URL || "",
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
  console.log("  Default Provider:", config.provider);
  console.log("  Default Model:", config.models[config.provider as keyof typeof config.models] || "N/A");
  console.log("  API Keys:");
  console.log("    Anthropic:", config.anthropicApiKey ? "✓" : "✗");
  console.log("    OpenAI:", config.openaiApiKey ? "✓" : "✗");
  console.log("    DeepSeek:", config.deepseekApiKey ? "✓" : "✗");
  console.log("    OpenRouter:", config.openrouterApiKey ? "✓" : "✗");
  console.log("  Convex Site URL:", config.convexSiteUrl ? "✓" : "✗ (using fallback pricing)");
}
