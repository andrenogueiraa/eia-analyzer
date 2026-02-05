import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// List all studies with analysis count
export const list = query({
  handler: async (ctx) => {
    const studies = await ctx.db.query("studies").order("desc").collect();

    // Get analysis counts for each study
    const studiesWithCounts = await Promise.all(
      studies.map(async (study) => {
        const analyses = await ctx.db
          .query("analyses")
          .withIndex("by_study", (q) => q.eq("studyId", study._id))
          .collect();

        return {
          ...study,
          analysisCount: analyses.length,
          completedCount: analyses.filter((a) => a.status === "completed").length,
          processingCount: analyses.filter((a) => a.status === "processing").length,
          latestAnalysis: analyses.length > 0
            ? analyses.reduce((latest, a) => a.createdAt > latest.createdAt ? a : latest)
            : null,
        };
      })
    );

    return studiesWithCounts;
  },
});

// Get single study with all its analyses
export const get = query({
  args: { id: v.id("studies") },
  handler: async (ctx, args) => {
    const study = await ctx.db.get(args.id);
    if (!study) return null;

    const analyses = await ctx.db
      .query("analyses")
      .withIndex("by_study", (q) => q.eq("studyId", args.id))
      .order("desc")
      .collect();

    return {
      ...study,
      analyses,
    };
  },
});

// Get file URL from storage
export const getFileUrl = query({
  args: { fileId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.fileId);
  },
});

// Create new study (upload)
export const create = mutation({
  args: {
    fileName: v.string(),
    fileId: v.id("_storage"),
    fileSize: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("studies", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Update study description
export const updateDescription = mutation({
  args: {
    id: v.id("studies"),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      description: args.description,
    });
  },
});

// Remove study and all its analyses
export const remove = mutation({
  args: { id: v.id("studies") },
  handler: async (ctx, args) => {
    // Get the study first
    const study = await ctx.db.get(args.id);
    if (!study) {
      throw new Error("Study not found");
    }

    // Delete all analyses for this study
    const analyses = await ctx.db
      .query("analyses")
      .withIndex("by_study", (q) => q.eq("studyId", args.id))
      .collect();

    for (const analysis of analyses) {
      await ctx.db.delete(analysis._id);
    }

    // Delete the file from storage
    await ctx.storage.delete(study.fileId);

    // Delete the study
    await ctx.db.delete(args.id);
  },
});

// Generate upload URL for file
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Get statistics
export const stats = query({
  handler: async (ctx) => {
    const studies = await ctx.db.query("studies").collect();
    const analyses = await ctx.db.query("analyses").collect();

    const totalCost = analyses.reduce((sum, a) => sum + (a.cost || 0), 0);

    return {
      totalStudies: studies.length,
      totalAnalyses: analyses.length,
      pending: analyses.filter((a) => a.status === "pending").length,
      processing: analyses.filter((a) => a.status === "processing").length,
      completed: analyses.filter((a) => a.status === "completed").length,
      failed: analyses.filter((a) => a.status === "failed").length,
      totalCost,
    };
  },
});
