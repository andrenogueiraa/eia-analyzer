import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
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
