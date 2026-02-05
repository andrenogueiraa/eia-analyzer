import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============ PROVIDERS ============

export const listProviders = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("providers")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect()
      .then((providers) => providers.sort((a, b) => a.order - b.order));
  },
});

export const getProviderBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("providers")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

// ============ MODELS ============

export const listModels = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("models")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

export const getModelBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("models")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const listModelsByFamily = query({
  args: { family: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("models")
      .withIndex("by_family", (q) => q.eq("family", args.family))
      .collect();
  },
});

// ============ PROVIDER MODELS (with pricing) ============

export const listProviderModels = query({
  args: { providerId: v.optional(v.id("providers")) },
  handler: async (ctx, args) => {
    let query = ctx.db.query("providerModels");

    if (args.providerId) {
      query = query.withIndex("by_provider", (q) =>
        q.eq("providerId", args.providerId)
      );
    }

    const providerModels = await query.collect();

    // Enrich with provider and model data
    const enriched = await Promise.all(
      providerModels.map(async (pm) => {
        const provider = await ctx.db.get(pm.providerId);
        const model = await ctx.db.get(pm.modelId);
        return {
          ...pm,
          provider,
          model,
        };
      })
    );

    return enriched.filter((pm) => pm.isActive);
  },
});

export const getProviderModelByIdentifier = query({
  args: { modelIdentifier: v.string() },
  handler: async (ctx, args) => {
    const providerModel = await ctx.db
      .query("providerModels")
      .withIndex("by_identifier", (q) =>
        q.eq("modelIdentifier", args.modelIdentifier)
      )
      .first();

    if (!providerModel) return null;

    const provider = await ctx.db.get(providerModel.providerId);
    const model = await ctx.db.get(providerModel.modelId);

    return {
      ...providerModel,
      provider,
      model,
    };
  },
});

// Get all models available for a specific provider (enriched)
export const getModelsForProvider = query({
  args: { providerSlug: v.string() },
  handler: async (ctx, args) => {
    const provider = await ctx.db
      .query("providers")
      .withIndex("by_slug", (q) => q.eq("slug", args.providerSlug))
      .first();

    if (!provider) return [];

    const providerModels = await ctx.db
      .query("providerModels")
      .withIndex("by_provider", (q) => q.eq("providerId", provider._id))
      .collect();

    const enriched = await Promise.all(
      providerModels
        .filter((pm) => pm.isActive)
        .map(async (pm) => {
          const model = await ctx.db.get(pm.modelId);
          return {
            ...pm,
            model,
            provider,
          };
        })
    );

    return enriched;
  },
});

// Calculate cost for a given model identifier and token usage
export const calculateCost = query({
  args: {
    modelIdentifier: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    thinkingTokens: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const providerModel = await ctx.db
      .query("providerModels")
      .withIndex("by_identifier", (q) =>
        q.eq("modelIdentifier", args.modelIdentifier)
      )
      .first();

    if (!providerModel) {
      // Fallback pricing if model not found
      const inputCost = (args.inputTokens / 1_000_000) * 1.0;
      const outputCost = (args.outputTokens / 1_000_000) * 3.0;
      return Math.round((inputCost + outputCost) * 100) / 100;
    }

    const inputCost =
      (args.inputTokens / 1_000_000) * providerModel.inputCostPer1M;
    const outputCost =
      (args.outputTokens / 1_000_000) * providerModel.outputCostPer1M;

    // Thinking tokens use special rate if defined, otherwise output rate
    const thinkingRate =
      providerModel.thinkingCostPer1M ?? providerModel.outputCostPer1M;
    const thinkingCost =
      ((args.thinkingTokens || 0) / 1_000_000) * thinkingRate;

    return Math.round((inputCost + outputCost + thinkingCost) * 100) / 100;
  },
});

// ============ ADMIN MUTATIONS ============

export const createProvider = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    baseUrl: v.string(),
    description: v.optional(v.string()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("providers", {
      ...args,
      isActive: true,
    });
  },
});

export const createModel = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    family: v.string(),
    description: v.optional(v.string()),
    contextWindow: v.number(),
    maxOutputTokens: v.number(),
    supportsThinking: v.boolean(),
    supportsTools: v.boolean(),
    supportsVision: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("models", {
      ...args,
      isActive: true,
    });
  },
});

export const createProviderModel = mutation({
  args: {
    providerId: v.id("providers"),
    modelId: v.id("models"),
    modelIdentifier: v.string(),
    inputCostPer1M: v.number(),
    outputCostPer1M: v.number(),
    thinkingCostPer1M: v.optional(v.number()),
    isDefault: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("providerModels", {
      ...args,
      isActive: true,
    });
  },
});

export const updateProviderModelPricing = mutation({
  args: {
    id: v.id("providerModels"),
    inputCostPer1M: v.number(),
    outputCostPer1M: v.number(),
    thinkingCostPer1M: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...pricing } = args;
    await ctx.db.patch(id, pricing);
  },
});

export const toggleProviderModelActive = mutation({
  args: {
    id: v.id("providerModels"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isActive: args.isActive });
  },
});
