import { mutation, query, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Get all analyses
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("analyses").order("desc").collect();
  },
});

// Get single analysis
export const get = query({
  args: { id: v.id("analyses") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get file URL from storage
export const getFileUrl = query({
  args: { fileId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.fileId);
  },
});

// Create new analysis
export const create = mutation({
  args: {
    fileName: v.string(),
    fileId: v.id("_storage"),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("analyses", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

// Get statistics
export const stats = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("analyses").collect();
    return {
      total: all.length,
      pending: all.filter((a) => a.status === "pending").length,
      processing: all.filter((a) => a.status === "processing").length,
      completed: all.filter((a) => a.status === "completed").length,
      failed: all.filter((a) => a.status === "failed").length,
      totalCost: 0,
    };
  },
});

// Generate upload URL for file
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Start analysis (action - can call external APIs)
export const startAnalysis = action({
  args: {
    id: v.id("analyses"),
    callbackUrl: v.string(),
    config: v.optional(
      v.object({
        provider: v.string(),
        model: v.string(),
        temperature: v.number(),
        maxTokens: v.number(),
        enableThinking: v.boolean(),
        thinkingBudget: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Get analysis record
    const analysis = await ctx.runQuery(api.analyses.get, { id: args.id });
    if (!analysis) {
      throw new Error("Analysis not found");
    }

    // Get file URL from storage
    const fileUrl = await ctx.storage.getUrl(analysis.fileId);
    if (!fileUrl) {
      throw new Error("File not found in storage");
    }

    // Call the analysis API
    const apiUrl = "http://localhost:3001"; // For local development
    const response = await fetch(`${apiUrl}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileUrl,
        analysisId: args.id,
        callbackUrl: args.callbackUrl,
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
    await ctx.db.patch(id, {
      status: "processing",
      progress,
    });
  },
});

export const complete = internalMutation({
  args: {
    id: v.id("analyses"),
    result: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "completed",
      result: args.result,
      completedAt: Date.now(),
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
