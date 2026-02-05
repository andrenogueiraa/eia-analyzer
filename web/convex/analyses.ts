import { mutation, query, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Config validator
const configValidator = v.object({
  provider: v.string(),
  model: v.string(),
  temperature: v.number(),
  maxTokens: v.number(),
  enableThinking: v.boolean(),
  thinkingBudget: v.number(),
});

// Get all analyses
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("analyses").order("desc").collect();
  },
});

// List analyses by study
export const listByStudy = query({
  args: { studyId: v.id("studies") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("analyses")
      .withIndex("by_study", (q) => q.eq("studyId", args.studyId))
      .order("desc")
      .collect();
  },
});

// Get single analysis with study data
export const get = query({
  args: { id: v.id("analyses") },
  handler: async (ctx, args) => {
    const analysis = await ctx.db.get(args.id);
    if (!analysis) return null;

    const study = await ctx.db.get(analysis.studyId);

    return {
      ...analysis,
      study,
    };
  },
});

// Get file URL from storage (delegated to studies)
export const getFileUrl = query({
  args: { fileId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.fileId);
  },
});

// Create new analysis for a study
export const create = mutation({
  args: {
    studyId: v.id("studies"),
    config: configValidator,
  },
  handler: async (ctx, args) => {
    // Verify study exists
    const study = await ctx.db.get(args.studyId);
    if (!study) {
      throw new Error("Study not found");
    }

    return await ctx.db.insert("analyses", {
      studyId: args.studyId,
      config: args.config,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

// Get statistics (kept for backwards compatibility, use studies.stats instead)
export const stats = query({
  handler: async (ctx) => {
    const analyses = await ctx.db.query("analyses").collect();
    const totalCost = analyses.reduce((sum, a) => sum + (a.cost || 0), 0);

    return {
      total: analyses.length,
      pending: analyses.filter((a) => a.status === "pending").length,
      processing: analyses.filter((a) => a.status === "processing").length,
      completed: analyses.filter((a) => a.status === "completed").length,
      failed: analyses.filter((a) => a.status === "failed").length,
      totalCost,
    };
  },
});

// Generate upload URL for file (kept for backwards compatibility)
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Reset analysis status to pending (for retry)
export const resetStatus = mutation({
  args: { id: v.id("analyses") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "pending",
      progress: undefined,
      error: undefined,
      startedAt: undefined,
    });
  },
});

// Delete analysis
export const remove = mutation({
  args: { id: v.id("analyses") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Start analysis (action - can call external APIs)
export const startAnalysis = action({
  args: {
    id: v.id("analyses"),
    callbackUrl: v.string(),
  },
  handler: async (ctx, args) => {
    // Get analysis record with study data
    const analysis = await ctx.runQuery(api.analyses.get, { id: args.id });
    if (!analysis) {
      throw new Error("Analysis not found");
    }

    if (!analysis.study) {
      throw new Error("Study not found for this analysis");
    }

    // Get file URL from storage
    const fileUrl = await ctx.storage.getUrl(analysis.study.fileId);
    if (!fileUrl) {
      throw new Error("File not found in storage");
    }

    // Call the analysis API
    const apiUrl = "http://localhost:3001";
    const response = await fetch(`${apiUrl}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileUrl,
        analysisId: args.id,
        callbackUrl: args.callbackUrl,
        config: analysis.config,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${error}`);
    }

    return await response.json();
  },
});

// Internal mutations (called by webhook)
export const updateProgress = internalMutation({
  args: {
    id: v.id("analyses"),
    phase: v.number(),
    phaseName: v.string(),
    percentage: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, ...progress } = args;
    const analysis = await ctx.db.get(id);

    const updates: any = {
      status: "processing",
      progress,
    };

    // Set startedAt on first progress update
    if (analysis && !analysis.startedAt) {
      updates.startedAt = Date.now();
    }

    await ctx.db.patch(id, updates);
  },
});

export const complete = internalMutation({
  args: {
    id: v.id("analyses"),
    result: v.any(),
    cost: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "completed",
      result: args.result,
      completedAt: Date.now(),
      cost: args.cost,
    });
  },
});

export const fail = internalMutation({
  args: {
    id: v.id("analyses"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "failed",
      error: args.error,
    });
  },
});
