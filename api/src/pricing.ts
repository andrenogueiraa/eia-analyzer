// Pricing module - fetches pricing from Convex or uses fallback
import { config } from "./config";

interface ModelPricing {
  input: number;
  output: number;
  thinking?: number;
}

// Cache for pricing data
let pricingCache: Record<string, ModelPricing> | null = null;
let lastFetch = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Fallback pricing (used when Convex is not available)
const FALLBACK_PRICING: Record<string, ModelPricing> = {
  // ============ ANTHROPIC DIRECT ============
  "claude-opus-4-5-20251101": { input: 15.0, output: 75.0 },
  "claude-sonnet-4-5-20250514": { input: 3.0, output: 15.0 },

  // ============ OPENAI DIRECT ============
  "gpt-5.2": { input: 12.0, output: 48.0 },
  "gpt-5.2-codex": { input: 12.0, output: 48.0 },

  // ============ GOOGLE DIRECT ============
  "gemini-3-pro-preview": { input: 2.5, output: 10.0, thinking: 10.0 },
  "gemini-3-flash": { input: 0.15, output: 0.6, thinking: 0.6 },

  // ============ DEEPSEEK DIRECT ============
  "deepseek-chat": { input: 0.27, output: 1.1 },

  // ============ ZHIPU DIRECT ============
  "glm-4-0520": { input: 1.0, output: 4.0 },

  // ============ MOONSHOT DIRECT ============
  "moonshot-v1-128k": { input: 0.5, output: 1.5 },

  // ============ OPENROUTER ============
  // Claude via OpenRouter
  "anthropic/claude-opus-4-5": { input: 15.0, output: 75.0 },
  "anthropic/claude-sonnet-4-5": { input: 3.0, output: 15.0 },

  // GPT via OpenRouter
  "openai/gpt-5.2": { input: 12.0, output: 48.0 },
  "openai/gpt-5.2-codex": { input: 12.0, output: 48.0 },

  // Gemini via OpenRouter
  "google/gemini-3-pro-preview": { input: 2.5, output: 10.0, thinking: 10.0 },
  "google/gemini-3-flash": { input: 0.15, output: 0.6, thinking: 0.6 },

  // DeepSeek via OpenRouter
  "deepseek/deepseek-chat-v3.2": { input: 0.27, output: 1.1 },

  // GLM via OpenRouter
  "zhipu/glm-4.7": { input: 1.0, output: 4.0 },

  // Kimi via OpenRouter (default)
  "moonshotai/kimi-k2.5": { input: 0.5, output: 1.5 },

  // Default fallback
  default: { input: 1.0, output: 3.0 },
};

/**
 * Fetch pricing from Convex
 */
async function fetchPricingFromConvex(): Promise<Record<string, ModelPricing> | null> {
  const convexSiteUrl = process.env.VITE_CONVEX_SITE_URL || config.convexSiteUrl;

  if (!convexSiteUrl) {
    console.log("[Pricing] No Convex site URL configured, using fallback");
    return null;
  }

  try {
    const response = await fetch(`${convexSiteUrl}/pricing`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      console.error(`[Pricing] Failed to fetch from Convex: ${response.status}`);
      return null;
    }

    const data = await response.json() as Record<string, ModelPricing>;
    console.log(`[Pricing] Fetched ${Object.keys(data).length} model prices from Convex`);
    return data;
  } catch (error) {
    console.error("[Pricing] Error fetching from Convex:", error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Get pricing for a specific model (with caching)
 */
export async function getModelPricing(modelIdentifier: string): Promise<ModelPricing> {
  // Check if cache is stale
  const now = Date.now();
  if (!pricingCache || now - lastFetch > CACHE_TTL) {
    const convexPricing = await fetchPricingFromConvex();
    if (convexPricing) {
      pricingCache = convexPricing;
      lastFetch = now;
    } else if (!pricingCache) {
      // Use fallback if no cache exists
      pricingCache = FALLBACK_PRICING;
      lastFetch = now;
    }
  }

  // Look for exact match
  if (pricingCache[modelIdentifier]) {
    return pricingCache[modelIdentifier];
  }

  // Try to match by model name (without provider prefix)
  const modelName = modelIdentifier.split("/").pop() || modelIdentifier;
  if (pricingCache[modelName]) {
    return pricingCache[modelName];
  }

  // Check fallback
  if (FALLBACK_PRICING[modelIdentifier]) {
    return FALLBACK_PRICING[modelIdentifier];
  }
  if (FALLBACK_PRICING[modelName]) {
    return FALLBACK_PRICING[modelName];
  }

  // Return default pricing
  return FALLBACK_PRICING.default;
}

/**
 * Calculate cost for a given model and token usage
 */
export async function calculateCost(
  modelIdentifier: string,
  inputTokens: number,
  outputTokens: number,
  thinkingTokens = 0
): Promise<number> {
  const pricing = await getModelPricing(modelIdentifier);

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;

  // Thinking tokens use special rate if available, otherwise output rate
  const thinkingRate = pricing.thinking ?? pricing.output;
  const thinkingCost = (thinkingTokens / 1_000_000) * thinkingRate;

  return Math.round((inputCost + outputCost + thinkingCost) * 100) / 100;
}

/**
 * Force refresh pricing cache
 */
export async function refreshPricing(): Promise<void> {
  const convexPricing = await fetchPricingFromConvex();
  if (convexPricing) {
    pricingCache = convexPricing;
    lastFetch = Date.now();
  }
}

/**
 * Get all available pricing (for debugging)
 */
export function getAllPricing(): Record<string, ModelPricing> {
  return pricingCache || FALLBACK_PRICING;
}
