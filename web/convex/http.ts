import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

const http = httpRouter();

// Webhook to receive analysis updates from the API
http.route({
  path: "/analysis-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { type, analysisId, progress, result, error } = body;

    try {
      if (type === "progress") {
        // Update progress
        await ctx.runMutation(internal.analyses.updateProgress, {
          id: analysisId,
          phase: progress.phase,
          phaseName: progress.phaseName,
          percentage: progress.percentage,
        });
      } else if (type === "complete") {
        // Mark as completed
        await ctx.runMutation(internal.analyses.complete, {
          id: analysisId,
          result,
        });
      } else if (type === "error") {
        // Mark as failed
        await ctx.runMutation(internal.analyses.fail, {
          id: analysisId,
          error,
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Webhook error:", err);
      return new Response(
        JSON.stringify({
          error: err instanceof Error ? err.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

export default http;
