import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  analyses: defineTable({
    fileName: v.string(),
    fileId: v.id("_storage"),
    fileSize: v.number(),
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
    result: v.optional(v.any()), // Full analysis result
    error: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    cost: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),
});
