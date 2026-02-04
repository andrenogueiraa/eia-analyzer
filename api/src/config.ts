import { config as dotenvConfig } from "dotenv";

dotenvConfig();

export const config = {
  // Provider: anthropic, openai, deepseek, kimi, openrouter
  provider: process.env.AI_PROVIDER || "openrouter",

  // OpenRouter specific: force a specific provider (e.g., "Together" for US-based)
  openrouterProvider: process.env.OPENROUTER_PROVIDER || undefined,

  // API Keys
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || "",
  kimiApiKey: process.env.KIMI_API_KEY || "",
  openrouterApiKey: process.env.OPENROUTER_API_KEY || "",

  // Modelos por provider
  models: {
    anthropic: process.env.ANTHROPIC_MODEL || "claude-opus-4-5",
    openai: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
    deepseek: process.env.DEEPSEEK_MODEL || "deepseek-chat",
    kimi: process.env.KIMI_MODEL || "moonshot-v1-128k",
    openrouter: process.env.OPENROUTER_MODEL || "moonshotai/kimi-k2.5",
  },

  // Thinking budgets (apenas para modelos que suportam)
  thinkingBudgets: {
    fase1: parseInt(process.env.THINKING_BUDGET_FASE1 || "15000"),
    fase2: parseInt(process.env.THINKING_BUDGET_FASE2 || "12000"),
    fase3: parseInt(process.env.THINKING_BUDGET_FASE3 || "10000"),
    fase4: parseInt(process.env.THINKING_BUDGET_FASE4 || "15000"),
  },

  // Diretórios
  inputDir: process.env.INPUT_DIR || "./data/input",
  outputDir: process.env.OUTPUT_DIR || "./data/output",
  logsDir: process.env.LOGS_DIR || "./logs",

  // Configurações de análise
  maxTokensResposta: parseInt(process.env.MAX_TOKENS || "16000"),
  temperature: parseFloat(process.env.TEMPERATURE || "0.3"),

  // Features
  enableTools: process.env.ENABLE_TOOLS !== "false",
  enableThinking: process.env.ENABLE_THINKING !== "false",
};

export function validateConfig(): void {
  const provider = config.provider;

  if (!["anthropic", "openai", "deepseek", "kimi", "openrouter"].includes(provider)) {
    throw new Error(`Provider inválido: ${provider}. Use: anthropic, openai, deepseek, kimi, ou openrouter`);
  }

  // Valida API key do provider selecionado
  if (provider === "anthropic" && !config.anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY não configurada");
  }
  if (provider === "openai" && !config.openaiApiKey) {
    throw new Error("OPENAI_API_KEY não configurada");
  }
  if (provider === "deepseek" && !config.deepseekApiKey) {
    throw new Error("DEEPSEEK_API_KEY não configurada");
  }
  if (provider === "kimi" && !config.kimiApiKey) {
    throw new Error("KIMI_API_KEY não configurada");
  }
  if (provider === "openrouter" && !config.openrouterApiKey) {
    throw new Error("OPENROUTER_API_KEY não configurada");
  }

  console.log(`✓ Configuração validada`);
  console.log(`  Provider: ${provider}`);
  if (provider === "openrouter" && config.openrouterProvider) {
    console.log(`  OpenRouter Provider: ${config.openrouterProvider} (US-based)`);
  }
  console.log(`  Modelo: ${config.models[provider as keyof typeof config.models]}`);
  console.log(`  Extended Thinking: ${config.enableThinking ? "Ativado" : "Desativado"}`);
  console.log(`  Tools: ${config.enableTools ? "Ativados" : "Desativados"}`);
}
