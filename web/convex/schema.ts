import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // AI Providers (Anthropic, OpenAI, DeepSeek, OpenRouter, etc.)
  providers: defineTable({
    slug: v.string(), // e.g., "anthropic", "openai", "openrouter"
    name: v.string(), // e.g., "Anthropic", "OpenAI", "OpenRouter"
    baseUrl: v.string(), // API base URL
    description: v.optional(v.string()),
    isActive: v.boolean(),
    order: v.number(), // Display order in UI
  })
    .index("by_slug", ["slug"])
    .index("by_active", ["isActive"]),

  // AI Models (canonical model definitions)
  models: defineTable({
    slug: v.string(), // e.g., "claude-opus-4-5", "gpt-4-turbo"
    name: v.string(), // e.g., "Claude Opus 4.5", "GPT-4 Turbo"
    family: v.string(), // e.g., "claude", "gpt", "deepseek", "kimi"
    description: v.optional(v.string()),
    contextWindow: v.number(), // Max context in tokens
    maxOutputTokens: v.number(), // Max output tokens
    supportsThinking: v.boolean(), // Extended thinking support
    supportsTools: v.boolean(), // Function calling support
    supportsVision: v.boolean(), // Image input support
    isActive: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_family", ["family"])
    .index("by_active", ["isActive"]),

  // Provider-Model mappings with pricing (junction table)
  providerModels: defineTable({
    providerId: v.id("providers"),
    modelId: v.id("models"),
    modelIdentifier: v.string(), // API identifier (e.g., "claude-opus-4-5-20251101", "anthropic/claude-opus-4-5")
    inputCostPer1M: v.number(), // Cost per 1M input tokens in USD
    outputCostPer1M: v.number(), // Cost per 1M output tokens in USD
    thinkingCostPer1M: v.optional(v.number()), // Cost per 1M thinking tokens (if different)
    isDefault: v.boolean(), // Default model for this provider
    isActive: v.boolean(),
    notes: v.optional(v.string()), // e.g., "via Together", "cache discount available"
  })
    .index("by_provider", ["providerId"])
    .index("by_model", ["modelId"])
    .index("by_provider_model", ["providerId", "modelId"])
    .index("by_identifier", ["modelIdentifier"]),

  // Studies - PDF documents uploaded for analysis
  studies: defineTable({
    fileName: v.string(),
    fileId: v.id("_storage"),
    fileSize: v.number(),
    createdAt: v.number(),
    description: v.optional(v.string()),
  })
    .index("by_created", ["createdAt"]),

  // Analyses - individual analysis attempts on studies
  analyses: defineTable({
    studyId: v.id("studies"),
    config: v.object({
      provider: v.string(),
      model: v.string(),
      temperature: v.number(),
      maxTokens: v.number(),
      enableThinking: v.boolean(),
      thinkingBudget: v.number(),
    }),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    progress: v.optional(
      v.object({
        phase: v.number(),
        phaseName: v.string(),
        percentage: v.number(),
      })
    ),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    cost: v.optional(v.number()),
  })
    .index("by_study", ["studyId"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),
});
