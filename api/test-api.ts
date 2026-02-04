#!/usr/bin/env bun

import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: "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",
  defaultHeaders: {
    "HTTP-Referer": "https://github.com/analise-eia",
    "X-Title": "Analisador de EIA",
  },
});

console.log("Testing OpenRouter API with small prompt...");

try {
  const response = await client.chat.completions.create({
    model: "moonshotai/kimi-k2.5",
    messages: [{
      role: "user",
      content: "Say 'hello' in Portuguese"
    }],
    max_tokens: 100,
  });

  console.log("SUCCESS!");
  console.log("Response:", response.choices[0].message.content);
  console.log("Tokens:", response.usage);
} catch (error: any) {
  console.error("ERROR:", error.message);
  console.error("Details:", error);
}
