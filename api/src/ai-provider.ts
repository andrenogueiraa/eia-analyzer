import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { config } from "./config";
import type { ToolDefinition } from "./types";

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIResponse {
  content: string;
  thinkingContent?: string;
  toolCalls?: any[];
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

export abstract class AIProvider {
  abstract generateResponse(options: AIRequestOptions): Promise<AIResponse>;
  abstract get supportsThinking(): boolean;
  abstract get supportsTools(): boolean;
}

// ============ ANTHROPIC CLAUDE ============
class AnthropicProvider extends AIProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    super();
    this.client = new Anthropic({ apiKey });
  }

  get supportsThinking(): boolean {
    return true;
  }

  get supportsTools(): boolean {
    return true;
  }

  async generateResponse(options: AIRequestOptions): Promise<AIResponse> {
    const {
      messages,
      thinkingBudget,
      tools,
      maxTokens = config.maxTokensResposta,
      temperature = config.temperature,
    } = options;

    const params: any = {
      model: config.models.anthropic,
      max_tokens: maxTokens,
      temperature,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    };

    // Extended thinking (se configurado e suportado)
    if (thinkingBudget && config.enableThinking) {
      params.thinking = {
        type: "enabled",
        budget_tokens: thinkingBudget,
      };
    }

    // Tools (se fornecidas e habilitadas)
    if (tools && tools.length > 0 && config.enableTools) {
      params.tools = tools;
    }

    const response = await this.client.messages.create(params);

    // Extrair conteúdo e thinking
    let textContent = "";
    let thinkingContent = "";

    for (const block of response.content) {
      if (block.type === "text") {
        textContent += block.text;
      } else if (block.type === "thinking") {
        thinkingContent += block.thinking;
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

// ============ OPENAI GPT ============
class OpenAIProvider extends AIProvider {
  private apiKey: string;
  private baseURL = "https://api.openai.com/v1";

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  get supportsThinking(): boolean {
    return false; // OpenAI não tem extended thinking nativo
  }

  get supportsTools(): boolean {
    return true;
  }

  async generateResponse(options: AIRequestOptions): Promise<AIResponse> {
    const {
      messages,
      tools,
      maxTokens = config.maxTokensResposta,
      temperature = config.temperature,
    } = options;

    const body: any = {
      model: config.models.openai,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: maxTokens,
      temperature,
    };

    if (tools && tools.length > 0 && config.enableTools) {
      body.tools = tools.map((t) => ({
        type: "function",
        function: {
          name: t.name,
          description: t.description,
          parameters: t.input_schema,
        },
      }));
    }

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const message = data.choices[0].message;

    return {
      content: message.content || "",
      toolCalls: message.tool_calls,
      usage: {
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens,
      },
    };
  }
}

// ============ DEEPSEEK ============
class DeepSeekProvider extends AIProvider {
  private apiKey: string;
  private baseURL = "https://api.deepseek.com/v1";

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  get supportsThinking(): boolean {
    return true; // DeepSeek R1 tem "reasoning"
  }

  get supportsTools(): boolean {
    return true;
  }

  async generateResponse(options: AIRequestOptions): Promise<AIResponse> {
    const {
      messages,
      tools,
      maxTokens = config.maxTokensResposta,
      temperature = config.temperature,
    } = options;

    const body: any = {
      model: config.models.deepseek,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: maxTokens,
      temperature,
    };

    if (tools && tools.length > 0 && config.enableTools) {
      body.tools = tools.map((t) => ({
        type: "function",
        function: {
          name: t.name,
          description: t.description,
          parameters: t.input_schema,
        },
      }));
    }

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    const data = await response.json();
    const message = data.choices[0].message;

    // DeepSeek pode ter reasoning no conteúdo
    let thinkingContent = "";
    let textContent = message.content || "";

    // Se tiver reasoning_content separado (DeepSeek R1)
    if (message.reasoning_content) {
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
}

// ============ KIMI (Moonshot AI) ============
class KimiProvider extends AIProvider {
  private apiKey: string;
  private baseURL = "https://api.moonshot.cn/v1";

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  get supportsThinking(): boolean {
    return false;
  }

  get supportsTools(): boolean {
    return true;
  }

  async generateResponse(options: AIRequestOptions): Promise<AIResponse> {
    const {
      messages,
      tools,
      maxTokens = config.maxTokensResposta,
      temperature = config.temperature,
    } = options;

    const body: any = {
      model: config.models.kimi,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: maxTokens,
      temperature,
    };

    if (tools && tools.length > 0 && config.enableTools) {
      body.tools = tools.map((t) => ({
        type: "function",
        function: {
          name: t.name,
          description: t.description,
          parameters: t.input_schema,
        },
      }));
    }

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Kimi API error: ${response.statusText}`);
    }

    const data = await response.json();
    const message = data.choices[0].message;

    return {
      content: message.content || "",
      toolCalls: message.tool_calls,
      usage: {
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens,
      },
    };
  }
}

// ============ OPENROUTER (Agregador) ============
class OpenRouterProvider extends AIProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    super();
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
    // Kimi K2.5 suporta reasoning quando habilitado
    const model = config.models.openrouter;
    return model.includes("kimi") || model.includes("deepseek");
  }

  get supportsTools(): boolean {
    return true;
  }

  async generateResponse(options: AIRequestOptions): Promise<AIResponse> {
    const {
      messages,
      tools,
      thinkingBudget,
      maxTokens = config.maxTokensResposta,
      temperature = config.temperature,
    } = options;

    const requestParams: any = {
      model: config.models.openrouter,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: maxTokens,
      temperature,
    };

    // Force specific provider (e.g., Together for US-based routing)
    if (config.openrouterProvider) {
      requestParams.provider = {
        order: [config.openrouterProvider],
        allow_fallbacks: false, // Don't fallback to other providers
      };
    }

    // Tools
    if (tools && tools.length > 0 && config.enableTools) {
      requestParams.tools = tools.map((t) => ({
        type: "function",
        function: {
          name: t.name,
          description: t.description,
          parameters: t.input_schema,
        },
      }));
    }

    // Reasoning (para modelos que suportam como Kimi K2.5)
    if (thinkingBudget && config.enableThinking && this.supportsThinking) {
      requestParams.reasoning = { enabled: true };
    }

    try {
      const response = await this.client.chat.completions.create(requestParams);

      // Tipo estendido para pegar reasoning_details
      type ORChatMessage = (typeof response)["choices"][number]["message"] & {
        reasoning_details?: any;
      };

      const message = response.choices[0].message as ORChatMessage;

      // Extrair reasoning se disponível
      let thinkingContent = "";
      if (message.reasoning_details) {
        // Kimi K2.5 retorna reasoning_details como objeto
        thinkingContent = JSON.stringify(message.reasoning_details, null, 2);
      }

      return {
        content: message.content || "",
        thinkingContent: thinkingContent || undefined,
        toolCalls: message.tool_calls,
        usage: {
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0,
        },
      };
    } catch (error: any) {
      throw new Error(`OpenRouter API error: ${error.message}`);
    }
  }
}

// ============ FACTORY ============
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
      throw new Error(`Provider não suportado: ${provider}`);
  }
}
