import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { config } from "./config";
import type { ToolDefinition, AnalysisConfig } from "./types";

// ============ TYPES ============
export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIResponse {
  content: string;
  thinkingContent?: string;
  toolCalls?: OpenAIToolCall[];
  usage?: {
    inputTokens: number;
    outputTokens: number;
    thinkingTokens?: number;
  };
}

export interface AIRequestOptions {
  messages: AIMessage[];
  thinkingBudget?: number;
  tools?: ToolDefinition[];
  maxTokens?: number;
  temperature?: number;
}

// OpenAI-compatible API types
interface OpenAIToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

interface OpenAIMessage {
  role: string;
  content: string | null;
  tool_calls?: OpenAIToolCall[];
  reasoning_content?: string;
}

interface OpenAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
}

interface OpenAIChoice {
  message: OpenAIMessage;
  finish_reason: string;
}

interface OpenAIChatResponse {
  choices: OpenAIChoice[];
  usage: OpenAIUsage;
}

// ============ HELPERS ============

/** Convert tools to OpenAI function format */
function convertToolsToOpenAIFormat(tools: ToolDefinition[]) {
  return tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    },
  }));
}

/** Fetch from OpenAI-compatible API */
async function fetchOpenAICompatible(
  baseURL: string,
  apiKey: string,
  providerName: string,
  body: Record<string, unknown>
): Promise<OpenAIChatResponse> {
  const response = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`${providerName} API error: ${response.statusText}`);
  }

  return response.json() as Promise<OpenAIChatResponse>;
}

/** Parse OpenAI-compatible response to AIResponse */
function parseOpenAIResponse(
  data: OpenAIChatResponse,
  extractReasoning = false
): AIResponse {
  const message = data.choices[0].message;

  let thinkingContent = "";
  const textContent = message.content || "";

  if (extractReasoning && message.reasoning_content) {
    thinkingContent = message.reasoning_content;
  }

  return {
    content: textContent,
    thinkingContent: thinkingContent || undefined,
    toolCalls: message.tool_calls,
    usage: {
      inputTokens: data.usage.prompt_tokens,
      outputTokens: data.usage.completion_tokens,
    },
  };
}

// ============ BASE CLASS ============
export abstract class AIProvider {
  protected analysisConfig?: AnalysisConfig;

  constructor(analysisConfig?: AnalysisConfig) {
    this.analysisConfig = analysisConfig;
  }

  abstract generateResponse(options: AIRequestOptions): Promise<AIResponse>;
  abstract get supportsThinking(): boolean;
  abstract get supportsTools(): boolean;

  protected getModel(defaultModel: string): string {
    return this.analysisConfig?.model || defaultModel;
  }

  protected getMaxTokens(optionValue?: number): number {
    return optionValue ?? this.analysisConfig?.maxTokens ?? config.maxTokensResposta;
  }

  protected getTemperature(optionValue?: number): number {
    return optionValue ?? this.analysisConfig?.temperature ?? config.temperature;
  }

  protected isThinkingEnabled(): boolean {
    return this.analysisConfig?.enableThinking ?? config.enableThinking;
  }
}

// ============ ANTHROPIC CLAUDE ============
class AnthropicProvider extends AIProvider {
  private client: Anthropic;

  constructor(apiKey: string, analysisConfig?: AnalysisConfig) {
    super(analysisConfig);
    this.client = new Anthropic({ apiKey });
  }

  get supportsThinking(): boolean {
    return true;
  }

  get supportsTools(): boolean {
    return true;
  }

  async generateResponse(options: AIRequestOptions): Promise<AIResponse> {
    const { messages, thinkingBudget, tools, maxTokens, temperature } = options;

    // Build params dynamically to avoid type issues with extended thinking
    const baseParams = {
      model: this.getModel(config.models.anthropic),
      max_tokens: this.getMaxTokens(maxTokens),
      messages: messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    };

    // Add optional params
    const extendedParams: Record<string, unknown> = { ...baseParams };

    // Temperature (only set if not using thinking)
    if (!thinkingBudget || !this.isThinkingEnabled()) {
      extendedParams.temperature = this.getTemperature(temperature);
    }

    // Extended thinking
    if (thinkingBudget && this.isThinkingEnabled()) {
      extendedParams.thinking = {
        type: "enabled",
        budget_tokens: thinkingBudget,
      };
    }

    // Tools
    if (tools && tools.length > 0 && config.enableTools) {
      extendedParams.tools = tools;
    }

    const response = await this.client.messages.create(
      extendedParams as unknown as Anthropic.MessageCreateParamsNonStreaming
    );

    let textContent = "";
    let thinkingContent = "";

    for (const block of response.content) {
      if (block.type === "text") {
        textContent += block.text;
      } else if ((block as { type: string }).type === "thinking") {
        thinkingContent += (block as { type: "thinking"; thinking: string }).thinking;
      }
    }

    return {
      content: textContent,
      thinkingContent: thinkingContent || undefined,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }
}

// ============ OPENAI-COMPATIBLE BASE ============
abstract class OpenAICompatibleProvider extends AIProvider {
  protected apiKey: string;
  protected abstract baseURL: string;
  protected abstract providerName: string;
  protected abstract defaultModel: string;

  constructor(apiKey: string, analysisConfig?: AnalysisConfig) {
    super(analysisConfig);
    this.apiKey = apiKey;
  }

  get supportsTools(): boolean {
    return true;
  }

  protected buildRequestBody(
    options: AIRequestOptions
  ): Record<string, unknown> {
    const { messages, tools, maxTokens, temperature } = options;

    const body: Record<string, unknown> = {
      model: this.getModel(this.defaultModel),
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: this.getMaxTokens(maxTokens),
      temperature: this.getTemperature(temperature),
    };

    if (tools && tools.length > 0 && config.enableTools) {
      body.tools = convertToolsToOpenAIFormat(tools);
    }

    return body;
  }

  protected async fetchCompletion(
    body: Record<string, unknown>
  ): Promise<OpenAIChatResponse> {
    return fetchOpenAICompatible(
      this.baseURL,
      this.apiKey,
      this.providerName,
      body
    );
  }
}

// ============ OPENAI GPT ============
class OpenAIProvider extends OpenAICompatibleProvider {
  protected baseURL = "https://api.openai.com/v1";
  protected providerName = "OpenAI";
  protected defaultModel = config.models.openai;

  get supportsThinking(): boolean {
    return false;
  }

  async generateResponse(options: AIRequestOptions): Promise<AIResponse> {
    const body = this.buildRequestBody(options);
    const data = await this.fetchCompletion(body);
    return parseOpenAIResponse(data);
  }
}

// ============ DEEPSEEK ============
class DeepSeekProvider extends OpenAICompatibleProvider {
  protected baseURL = "https://api.deepseek.com/v1";
  protected providerName = "DeepSeek";
  protected defaultModel = config.models.deepseek;

  get supportsThinking(): boolean {
    return true;
  }

  async generateResponse(options: AIRequestOptions): Promise<AIResponse> {
    const body = this.buildRequestBody(options);
    const data = await this.fetchCompletion(body);
    return parseOpenAIResponse(data, true);
  }
}

// ============ KIMI (Moonshot AI) ============
class KimiProvider extends OpenAICompatibleProvider {
  protected baseURL = "https://api.moonshot.cn/v1";
  protected providerName = "Kimi";
  protected defaultModel = config.models.kimi;

  get supportsThinking(): boolean {
    return false;
  }

  async generateResponse(options: AIRequestOptions): Promise<AIResponse> {
    const body = this.buildRequestBody(options);
    const data = await this.fetchCompletion(body);
    return parseOpenAIResponse(data);
  }
}

// ============ OPENROUTER (Aggregator) ============
class OpenRouterProvider extends AIProvider {
  private client: OpenAI;

  constructor(apiKey: string, analysisConfig?: AnalysisConfig) {
    super(analysisConfig);
    this.client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
      defaultHeaders: {
        "HTTP-Referer": "https://github.com/analise-eia",
        "X-Title": "Analisador de EIA",
      },
    });
  }

  get supportsThinking(): boolean {
    const model = this.getModel(config.models.openrouter);
    return model.includes("kimi") || model.includes("deepseek");
  }

  get supportsTools(): boolean {
    return true;
  }

  async generateResponse(options: AIRequestOptions): Promise<AIResponse> {
    const { messages, tools, thinkingBudget, maxTokens, temperature } = options;

    const requestParams: Record<string, unknown> = {
      model: this.getModel(config.models.openrouter),
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: this.getMaxTokens(maxTokens),
      temperature: this.getTemperature(temperature),
    };

    // Force specific provider routing
    if (config.openrouterProvider) {
      requestParams.provider = {
        order: [config.openrouterProvider],
        allow_fallbacks: false,
      };
    }

    // Tools
    if (tools && tools.length > 0 && config.enableTools) {
      requestParams.tools = convertToolsToOpenAIFormat(tools);
    }

    // Reasoning
    if (thinkingBudget && this.isThinkingEnabled() && this.supportsThinking) {
      requestParams.reasoning = { enabled: true };
    }

    try {
      const response = await this.client.chat.completions.create(
        requestParams as unknown as OpenAI.ChatCompletionCreateParamsNonStreaming
      );

      // Extended type for reasoning_details
      type ORChatMessage = (typeof response)["choices"][number]["message"] & {
        reasoning_details?: unknown;
      };

      const message = response.choices[0].message as ORChatMessage;

      let thinkingContent = "";
      if (message.reasoning_details) {
        thinkingContent = JSON.stringify(message.reasoning_details, null, 2);
      }

      return {
        content: message.content || "",
        thinkingContent: thinkingContent || undefined,
        toolCalls: message.tool_calls as OpenAIToolCall[] | undefined,
        usage: {
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`OpenRouter API error: ${message}`);
    }
  }
}

// ============ FACTORIES ============

/** Create provider using static config from environment */
export function createAIProvider(): AIProvider {
  const provider = config.provider;

  switch (provider) {
    case "anthropic":
      return new AnthropicProvider(config.anthropicApiKey);
    case "openai":
      return new OpenAIProvider(config.openaiApiKey);
    case "deepseek":
      return new DeepSeekProvider(config.deepseekApiKey);
    case "kimi":
      return new KimiProvider(config.kimiApiKey);
    case "openrouter":
      return new OpenRouterProvider(config.openrouterApiKey);
    default:
      throw new Error(`Provider nao suportado: ${provider}`);
  }
}

/** Create provider with dynamic analysis config */
export function createAIProviderWithConfig(
  analysisConfig: AnalysisConfig
): AIProvider {
  const provider = analysisConfig.provider;

  switch (provider) {
    case "anthropic":
      return new AnthropicProvider(config.anthropicApiKey, analysisConfig);
    case "openai":
      return new OpenAIProvider(config.openaiApiKey, analysisConfig);
    case "deepseek":
      return new DeepSeekProvider(config.deepseekApiKey, analysisConfig);
    case "kimi":
      return new KimiProvider(config.kimiApiKey, analysisConfig);
    case "openrouter":
      return new OpenRouterProvider(config.openrouterApiKey, analysisConfig);
    default:
      throw new Error(`Provider nao suportado: ${provider}`);
  }
}
