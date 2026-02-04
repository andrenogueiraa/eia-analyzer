#!/usr/bin/env bun

/**
 * Script para testar a configuração antes de rodar a análise completa
 */

import { config, validateConfig } from "./config";
import { createAIProvider } from "./ai-provider";

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║          🧪 TESTE DE CONFIGURAÇÃO                             ║
╚═══════════════════════════════════════════════════════════════╝
`);

try {
  // Validar configuração
  validateConfig();

  console.log(`\n✅ Configuração válida!`);

  // Testar provider
  console.log(`\n🔌 Testando conexão com provider...`);
  const provider = createAIProvider();

  console.log(`\n📊 Informações do provider:`);
  console.log(`   Extended Thinking: ${provider.supportsThinking ? "✅ Suportado" : "❌ Não suportado"}`);
  console.log(`   Tools: ${provider.supportsTools ? "✅ Suportado" : "❌ Não suportado"}`);

  // Fazer uma requisição simples de teste
  console.log(`\n🚀 Enviando requisição de teste...`);

  const response = await provider.generateResponse({
    messages: [
      {
        role: "user",
        content: "Responda apenas: 'Sistema funcionando corretamente!'",
      },
    ],
    maxTokens: 100,
  });

  console.log(`\n✅ Resposta recebida:`);
  console.log(`   ${response.content}`);
  console.log(`\n📈 Uso:`);
  console.log(`   Input tokens: ${response.usage?.inputTokens}`);
  console.log(`   Output tokens: ${response.usage?.outputTokens}`);

  console.log(`\n${"=".repeat(65)}`);
  console.log(`✅ TUDO FUNCIONANDO! Você pode rodar: bun run analyze`);
  console.log(`${"=".repeat(65)}\n`);
} catch (error) {
  console.error(`\n❌ ERRO: ${error}`);
  console.log(`\nVerifique:`);
  console.log(`  1. Arquivo .env existe e está configurado`);
  console.log(`  2. API key está correta`);
  console.log(`  3. Provider está disponível`);
  console.log(`\nUse .env.example como referência.\n`);
  process.exit(1);
}
