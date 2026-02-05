import { mutation } from "./_generated/server";

// Seed data for providers, models, and pricing
// Run this once to populate the database: `npx convex run seed:seedAll`

interface ProviderData {
  slug: string;
  name: string;
  baseUrl: string;
  description: string;
  order: number;
}

interface ModelData {
  slug: string;
  name: string;
  family: string;
  description: string;
  contextWindow: number;
  maxOutputTokens: number;
  supportsThinking: boolean;
  supportsTools: boolean;
  supportsVision: boolean;
}

interface ProviderModelData {
  providerSlug: string;
  modelSlug: string;
  modelIdentifier: string;
  inputCostPer1M: number;
  outputCostPer1M: number;
  thinkingCostPer1M?: number;
  isDefault: boolean;
  notes?: string;
}

const PROVIDERS: ProviderData[] = [
  {
    slug: "anthropic",
    name: "Anthropic",
    baseUrl: "https://api.anthropic.com",
    description: "Claude models - high quality, extended thinking",
    order: 1,
  },
  {
    slug: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com",
    description: "GPT models - versatile, widely used",
    order: 2,
  },
  {
    slug: "google",
    name: "Google AI",
    baseUrl: "https://generativelanguage.googleapis.com",
    description: "Gemini models - multimodal, large context",
    order: 3,
  },
  {
    slug: "deepseek",
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    description: "DeepSeek models - reasoning specialist, low cost",
    order: 4,
  },
  {
    slug: "zhipu",
    name: "Zhipu AI",
    baseUrl: "https://open.bigmodel.cn",
    description: "GLM models - Chinese AI leader",
    order: 5,
  },
  {
    slug: "moonshot",
    name: "Moonshot AI",
    baseUrl: "https://api.moonshot.cn",
    description: "Kimi models - long context specialist",
    order: 6,
  },
  {
    slug: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api",
    description: "Agregador - acesso a múltiplos modelos via única API",
    order: 10,
  },
];

const MODELS: ModelData[] = [
  // ============ ANTHROPIC CLAUDE ============
  {
    slug: "claude-opus-4-5",
    name: "Claude Opus 4.5",
    family: "claude",
    description: "Modelo mais avançado da Anthropic com extended thinking",
    contextWindow: 200000,
    maxOutputTokens: 32000,
    supportsThinking: true,
    supportsTools: true,
    supportsVision: true,
  },
  {
    slug: "claude-sonnet-4-5",
    name: "Claude Sonnet 4.5",
    family: "claude",
    description: "Equilíbrio entre performance e custo",
    contextWindow: 200000,
    maxOutputTokens: 16000,
    supportsThinking: true,
    supportsTools: true,
    supportsVision: true,
  },

  // ============ OPENAI GPT ============
  {
    slug: "gpt-5-2",
    name: "GPT-5.2",
    family: "gpt",
    description: "Modelo flagship da OpenAI - extra high capability",
    contextWindow: 256000,
    maxOutputTokens: 32000,
    supportsThinking: true,
    supportsTools: true,
    supportsVision: true,
  },
  {
    slug: "gpt-5-2-codex",
    name: "GPT-5.2 Codex",
    family: "gpt",
    description: "Especializado em código - extra high capability",
    contextWindow: 256000,
    maxOutputTokens: 32000,
    supportsThinking: true,
    supportsTools: true,
    supportsVision: true,
  },

  // ============ GOOGLE GEMINI ============
  {
    slug: "gemini-3-pro-preview",
    name: "Gemini 3 Pro Preview",
    family: "gemini",
    description: "Modelo Pro com high capability - preview",
    contextWindow: 2000000,
    maxOutputTokens: 65536,
    supportsThinking: true,
    supportsTools: true,
    supportsVision: true,
  },
  {
    slug: "gemini-3-flash",
    name: "Gemini 3 Flash",
    family: "gemini",
    description: "Modelo rápido e eficiente do Google",
    contextWindow: 1000000,
    maxOutputTokens: 32768,
    supportsThinking: true,
    supportsTools: true,
    supportsVision: true,
  },

  // ============ DEEPSEEK ============
  {
    slug: "deepseek-v3-2",
    name: "DeepSeek V3.2",
    family: "deepseek",
    description: "Última versão do DeepSeek - alta qualidade e baixo custo",
    contextWindow: 128000,
    maxOutputTokens: 16000,
    supportsThinking: true,
    supportsTools: true,
    supportsVision: false,
  },

  // ============ ZHIPU GLM ============
  {
    slug: "glm-4-7",
    name: "GLM-4.7",
    family: "glm",
    description: "Modelo avançado da Zhipu AI",
    contextWindow: 128000,
    maxOutputTokens: 16000,
    supportsThinking: true,
    supportsTools: true,
    supportsVision: true,
  },

  // ============ MOONSHOT KIMI ============
  {
    slug: "kimi-k2-5",
    name: "Kimi K2.5",
    family: "kimi",
    description: "Contexto longo com reasoning capabilities",
    contextWindow: 128000,
    maxOutputTokens: 16000,
    supportsThinking: true,
    supportsTools: true,
    supportsVision: false,
  },
];

const PROVIDER_MODELS: ProviderModelData[] = [
  // ============ ANTHROPIC DIRECT ============
  {
    providerSlug: "anthropic",
    modelSlug: "claude-opus-4-5",
    modelIdentifier: "claude-opus-4-5-20251101",
    inputCostPer1M: 15.0,
    outputCostPer1M: 75.0,
    isDefault: false,
    notes: "Highest capability, extended thinking",
  },
  {
    providerSlug: "anthropic",
    modelSlug: "claude-sonnet-4-5",
    modelIdentifier: "claude-sonnet-4-5-20250514",
    inputCostPer1M: 3.0,
    outputCostPer1M: 15.0,
    isDefault: true,
    notes: "Best balance of quality and cost",
  },

  // ============ OPENAI DIRECT ============
  {
    providerSlug: "openai",
    modelSlug: "gpt-5-2",
    modelIdentifier: "gpt-5.2",
    inputCostPer1M: 12.0,
    outputCostPer1M: 48.0,
    isDefault: true,
    notes: "Extra high capability (xhigh)",
  },
  {
    providerSlug: "openai",
    modelSlug: "gpt-5-2-codex",
    modelIdentifier: "gpt-5.2-codex",
    inputCostPer1M: 12.0,
    outputCostPer1M: 48.0,
    isDefault: false,
    notes: "Specialized for code (xhigh)",
  },

  // ============ GOOGLE DIRECT ============
  {
    providerSlug: "google",
    modelSlug: "gemini-3-pro-preview",
    modelIdentifier: "gemini-3-pro-preview",
    inputCostPer1M: 2.5,
    outputCostPer1M: 10.0,
    thinkingCostPer1M: 10.0,
    isDefault: true,
    notes: "High capability, 2M context",
  },
  {
    providerSlug: "google",
    modelSlug: "gemini-3-flash",
    modelIdentifier: "gemini-3-flash",
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.6,
    thinkingCostPer1M: 0.6,
    isDefault: false,
    notes: "Fast and economical, 1M context",
  },

  // ============ DEEPSEEK DIRECT ============
  {
    providerSlug: "deepseek",
    modelSlug: "deepseek-v3-2",
    modelIdentifier: "deepseek-chat",
    inputCostPer1M: 0.27,
    outputCostPer1M: 1.1,
    isDefault: true,
    notes: "Latest DeepSeek, great value",
  },

  // ============ ZHIPU DIRECT ============
  {
    providerSlug: "zhipu",
    modelSlug: "glm-4-7",
    modelIdentifier: "glm-4-0520",
    inputCostPer1M: 1.0,
    outputCostPer1M: 4.0,
    isDefault: true,
    notes: "Advanced Chinese model",
  },

  // ============ MOONSHOT DIRECT ============
  {
    providerSlug: "moonshot",
    modelSlug: "kimi-k2-5",
    modelIdentifier: "moonshot-v1-128k",
    inputCostPer1M: 0.5,
    outputCostPer1M: 1.5,
    isDefault: true,
    notes: "Long context specialist",
  },

  // ============ OPENROUTER (all models) ============
  // Claude via OpenRouter
  {
    providerSlug: "openrouter",
    modelSlug: "claude-opus-4-5",
    modelIdentifier: "anthropic/claude-opus-4-5",
    inputCostPer1M: 15.0,
    outputCostPer1M: 75.0,
    isDefault: false,
    notes: "Claude Opus via OpenRouter",
  },
  {
    providerSlug: "openrouter",
    modelSlug: "claude-sonnet-4-5",
    modelIdentifier: "anthropic/claude-sonnet-4-5",
    inputCostPer1M: 3.0,
    outputCostPer1M: 15.0,
    isDefault: false,
    notes: "Claude Sonnet via OpenRouter",
  },

  // GPT via OpenRouter
  {
    providerSlug: "openrouter",
    modelSlug: "gpt-5-2",
    modelIdentifier: "openai/gpt-5.2",
    inputCostPer1M: 12.0,
    outputCostPer1M: 48.0,
    isDefault: false,
    notes: "GPT-5.2 via OpenRouter (xhigh)",
  },
  {
    providerSlug: "openrouter",
    modelSlug: "gpt-5-2-codex",
    modelIdentifier: "openai/gpt-5.2-codex",
    inputCostPer1M: 12.0,
    outputCostPer1M: 48.0,
    isDefault: false,
    notes: "GPT-5.2 Codex via OpenRouter (xhigh)",
  },

  // Gemini via OpenRouter
  {
    providerSlug: "openrouter",
    modelSlug: "gemini-3-pro-preview",
    modelIdentifier: "google/gemini-3-pro-preview",
    inputCostPer1M: 2.5,
    outputCostPer1M: 10.0,
    thinkingCostPer1M: 10.0,
    isDefault: false,
    notes: "Gemini 3 Pro Preview via OpenRouter (high)",
  },
  {
    providerSlug: "openrouter",
    modelSlug: "gemini-3-flash",
    modelIdentifier: "google/gemini-3-flash",
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.6,
    thinkingCostPer1M: 0.6,
    isDefault: false,
    notes: "Gemini 3 Flash via OpenRouter",
  },

  // DeepSeek via OpenRouter
  {
    providerSlug: "openrouter",
    modelSlug: "deepseek-v3-2",
    modelIdentifier: "deepseek/deepseek-chat-v3.2",
    inputCostPer1M: 0.27,
    outputCostPer1M: 1.1,
    isDefault: false,
    notes: "DeepSeek V3.2 via OpenRouter",
  },

  // GLM via OpenRouter
  {
    providerSlug: "openrouter",
    modelSlug: "glm-4-7",
    modelIdentifier: "zhipu/glm-4.7",
    inputCostPer1M: 1.0,
    outputCostPer1M: 4.0,
    isDefault: false,
    notes: "GLM-4.7 via OpenRouter",
  },

  // Kimi via OpenRouter - DEFAULT
  {
    providerSlug: "openrouter",
    modelSlug: "kimi-k2-5",
    modelIdentifier: "moonshotai/kimi-k2.5",
    inputCostPer1M: 0.5,
    outputCostPer1M: 1.5,
    isDefault: true, // DEFAULT for OpenRouter
    notes: "Kimi K2.5 via OpenRouter - RECOMMENDED",
  },
];

// Seed all data
export const seedAll = mutation({
  handler: async (ctx) => {
    // Check if already seeded
    const existingProviders = await ctx.db.query("providers").collect();
    if (existingProviders.length > 0) {
      return { message: "Database already seeded. Use reseed to refresh.", skipped: true };
    }

    // Create providers
    const providerIds: Record<string, string> = {};
    for (const provider of PROVIDERS) {
      const id = await ctx.db.insert("providers", {
        ...provider,
        isActive: true,
      });
      providerIds[provider.slug] = id;
    }

    // Create models
    const modelIds: Record<string, string> = {};
    for (const model of MODELS) {
      const id = await ctx.db.insert("models", {
        ...model,
        isActive: true,
      });
      modelIds[model.slug] = id;
    }

    // Create provider-model mappings with pricing
    for (const pm of PROVIDER_MODELS) {
      const providerId = providerIds[pm.providerSlug];
      const modelId = modelIds[pm.modelSlug];

      if (providerId && modelId) {
        await ctx.db.insert("providerModels", {
          providerId: providerId as any,
          modelId: modelId as any,
          modelIdentifier: pm.modelIdentifier,
          inputCostPer1M: pm.inputCostPer1M,
          outputCostPer1M: pm.outputCostPer1M,
          thinkingCostPer1M: pm.thinkingCostPer1M,
          isDefault: pm.isDefault,
          isActive: true,
          notes: pm.notes,
        });
      }
    }

    return {
      message: "Database seeded successfully",
      providers: PROVIDERS.length,
      models: MODELS.length,
      providerModels: PROVIDER_MODELS.length,
    };
  },
});

// Clear all seed data (for development)
export const clearAll = mutation({
  handler: async (ctx) => {
    const providerModels = await ctx.db.query("providerModels").collect();
    for (const pm of providerModels) {
      await ctx.db.delete(pm._id);
    }

    const models = await ctx.db.query("models").collect();
    for (const model of models) {
      await ctx.db.delete(model._id);
    }

    const providers = await ctx.db.query("providers").collect();
    for (const provider of providers) {
      await ctx.db.delete(provider._id);
    }

    return { message: "All seed data cleared" };
  },
});

// Reseed (clear + seed)
export const reseed = mutation({
  handler: async (ctx) => {
    // Clear existing data
    const providerModels = await ctx.db.query("providerModels").collect();
    for (const pm of providerModels) {
      await ctx.db.delete(pm._id);
    }

    const models = await ctx.db.query("models").collect();
    for (const model of models) {
      await ctx.db.delete(model._id);
    }

    const providers = await ctx.db.query("providers").collect();
    for (const provider of providers) {
      await ctx.db.delete(provider._id);
    }

    // Recreate
    const providerIds: Record<string, string> = {};
    for (const provider of PROVIDERS) {
      const id = await ctx.db.insert("providers", {
        ...provider,
        isActive: true,
      });
      providerIds[provider.slug] = id;
    }

    const modelIds: Record<string, string> = {};
    for (const model of MODELS) {
      const id = await ctx.db.insert("models", {
        ...model,
        isActive: true,
      });
      modelIds[model.slug] = id;
    }

    for (const pm of PROVIDER_MODELS) {
      const providerId = providerIds[pm.providerSlug];
      const modelId = modelIds[pm.modelSlug];

      if (providerId && modelId) {
        await ctx.db.insert("providerModels", {
          providerId: providerId as any,
          modelId: modelId as any,
          modelIdentifier: pm.modelIdentifier,
          inputCostPer1M: pm.inputCostPer1M,
          outputCostPer1M: pm.outputCostPer1M,
          thinkingCostPer1M: pm.thinkingCostPer1M,
          isDefault: pm.isDefault,
          isActive: true,
          notes: pm.notes,
        });
      }
    }

    return {
      message: "Database reseeded successfully",
      providers: PROVIDERS.length,
      models: MODELS.length,
      providerModels: PROVIDER_MODELS.length,
    };
  },
});
