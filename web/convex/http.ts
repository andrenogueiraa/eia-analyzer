import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal, api } from "./_generated/api";

const http = httpRouter();

// GET /pricing - Get pricing for all models or specific model
http.route({
  path: "/pricing",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const modelIdentifier = url.searchParams.get("model");

    try {
      if (modelIdentifier) {
        // Get specific model pricing
        const providerModel = await ctx.runQuery(
          api.providers.getProviderModelByIdentifier,
          { modelIdentifier }
        );

        if (!providerModel) {
          return new Response(
            JSON.stringify({ error: "Model not found", modelIdentifier }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        return new Response(
          JSON.stringify({
            modelIdentifier: providerModel.modelIdentifier,
            inputCostPer1M: providerModel.inputCostPer1M,
            outputCostPer1M: providerModel.outputCostPer1M,
            thinkingCostPer1M: providerModel.thinkingCostPer1M,
            model: providerModel.model,
            provider: providerModel.provider,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      } else {
        // Get all provider models with pricing
        const providerModels = await ctx.runQuery(
          api.providers.listProviderModels,
          {}
        );

        // Transform to simple pricing map
        const pricing = providerModels.reduce(
          (acc: Record<string, { input: number; output: number; thinking?: number }>, pm) => {
            acc[pm.modelIdentifier] = {
              input: pm.inputCostPer1M,
              output: pm.outputCostPer1M,
              thinking: pm.thinkingCostPer1M,
            };
            return acc;
          },
          {}
        );

        return new Response(JSON.stringify(pricing), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch (err) {
      console.error("Pricing endpoint error:", err);
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

// Webhook to receive analysis updates from the API
http.route({
  path: "/analysis-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { type, analysisId, progress, result, error, cost } = body;

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
        // Mark as completed with cost
        await ctx.runMutation(internal.analyses.complete, {
          id: analysisId,
          result,
          cost,
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
