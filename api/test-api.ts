#!/usr/bin/env bun

import OpenAI from "openai";

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  console.error("ERROR: OPENROUTER_API_KEY environment variable not set");
  process.exit(1);
}

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey,
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
