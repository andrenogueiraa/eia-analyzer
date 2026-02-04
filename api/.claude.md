# API - EIA Analyzer Backend

Backend de análise de EIA usando IA com multi-provider support.

## Stack Tecnológico

- **Runtime:** Bun
- **Framework:** Express
- **Language:** TypeScript
- **IA Providers:**
  - DeepSeek (R1 Reasoner + v3)
  - OpenAI (GPT-4, GPT-3.5)
  - Anthropic (Claude Opus/Sonnet)
  - OpenRouter (Kimi, Gemini, Qwen, etc.)
- **PDF Processing:** pdf-parse
- **Environment:** dotenv

## Estrutura de Diretórios

```
api/
├── src/
│   ├── agents.ts          # Lógica de análise 4 fases
│   ├── ai-provider.ts     # Abstração multi-provider
│   ├── api.ts             # Express API server
│   ├── config.ts          # Configurações centralizadas
│   ├── extractor.ts       # Extração de PDF
│   ├── index.ts           # CLI para análise
│   ├── tools.ts           # Ferramentas especializadas
│   ├── types.ts           # TypeScript types
│   └── test-config.ts     # Testes de configuração
├── data/
│   ├── input/             # PDFs de entrada
│   └── output/            # Resultados JSON/MD
├── logs/                  # Logs da aplicação
├── .env                   # Variáveis de ambiente
└── package.json
```

## Configuração (.env)

```env
# Provider de IA
AI_PROVIDER=deepseek              # deepseek | openai | anthropic | openrouter

# API Keys
DEEPSEEK_API_KEY=sk-...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
OPENROUTER_API_KEY=sk-or-v1-...

# Modelos
DEEPSEEK_MODEL=deepseek-reasoner  # deepseek-reasoner | deepseek-chat
OPENAI_MODEL=gpt-4-turbo
ANTHROPIC_MODEL=claude-opus-4-5
OPENROUTER_MODEL=moonshotai/kimi-k2.5

# Extended Thinking (para modelos com reasoning)
ENABLE_THINKING=true
THINKING_BUDGET_FASE1=5000
THINKING_BUDGET_FASE2=3000
THINKING_BUDGET_FASE3=2000
THINKING_BUDGET_FASE4=5000

# Configurações gerais
MAX_TOKENS=16000
TEMPERATURE=0.3
ENABLE_TOOLS=true

# Diretórios
INPUT_DIR=./data/input
OUTPUT_DIR=./data/output
LOGS_DIR=./logs
```

## Arquitetura de Análise

### 4 Fases de Análise

1. **Fase 1: Leitura Profunda**
   - Extração completa do PDF
   - Mapeamento da estrutura
   - Identificação de áreas críticas
   - Contexto geral do documento

2. **Fase 2: Análise Especializada** (Paralela)
   - **Legal:** Conformidade com legislação
   - **Técnica:** Qualidade técnica dos estudos
   - **Impactos:** Avaliação de impactos ambientais
   - **Mitigação:** Efetividade das medidas mitigadoras

3. **Fase 3: Verificação Cruzada**
   - Validação entre análises
   - Detecção de contradições
   - Identificação de lacunas
   - Consistência geral

4. **Fase 4: Consolidação Final**
   - Relatório técnico completo
   - Notas e classificações
   - Problemas priorizados
   - Recomendações

## AI Provider System

### Abstração de Providers

```typescript
export abstract class AIProvider {
  abstract generateResponse(options: AIRequestOptions): Promise<AIResponse>;
  abstract get supportsThinking(): boolean;
  abstract get supportsTools(): boolean;
}
```

### Providers Implementados

1. **DeepSeekProvider**
   - Suporta: Reasoning (R1), Chat (v3)
   - Extended thinking nativo
   - Custo baixo

2. **OpenAIProvider**
   - Suporta: GPT-4, GPT-3.5
   - Sem reasoning nativo
   - Boa qualidade geral

3. **AnthropicProvider**
   - Suporta: Claude Opus, Sonnet
   - Extended thinking via prompt
   - Alta qualidade

4. **OpenRouterProvider**
   - Suporta: Múltiplos modelos
   - Provider selection (Together, SiliconFlow)
   - Flexível

5. **KimiProvider**
   - Suporta: Kimi K2.5
   - 128k context + reasoning
   - Via OpenRouter ou direto

## API Endpoints

### POST /analyze

Inicia análise de um PDF.

**Request:**
```json
{
  "fileUrl": "https://storage.url/file.pdf",
  "analysisId": "convex_id",
  "callbackUrl": "https://convex.site/webhook"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Analysis started",
  "analysisId": "convex_id"
}
```

**Callbacks (via webhook):**
```json
// Progress update
{
  "type": "progress",
  "analysisId": "id",
  "progress": {
    "phase": 2,
    "phaseName": "Análise Especializada",
    "percentage": 50
  }
}

// Completion
{
  "type": "complete",
  "analysisId": "id",
  "result": { /* resultado completo */ }
}

// Error
{
  "type": "error",
  "analysisId": "id",
  "error": "Error message"
}
```

### GET /health

Health check endpoint.

## Padrões de Código

### 1. Provider Implementation

```typescript
class NewProvider extends AIProvider {
  constructor(apiKey: string, model: string) {
    super();
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateResponse(options: AIRequestOptions): Promise<AIResponse> {
    // Implementação
  }

  get supportsThinking(): boolean {
    return false; // ou true
  }

  get supportsTools(): boolean {
    return false; // ou true
  }
}
```

### 2. Config Validation

```typescript
export function validateConfig(): void {
  if (!config.apiKey) {
    throw new Error(`API key not found for ${config.provider}`);
  }

  if (!config.model) {
    throw new Error("Model not configured");
  }

  // Mais validações
}
```

### 3. Error Handling

```typescript
try {
  const result = await provider.generateResponse(options);
  return result;
} catch (error) {
  if (error instanceof Error) {
    console.error(`Provider error: ${error.message}`);
    throw new Error(`Analysis failed: ${error.message}`);
  }
  throw error;
}
```

### 4. Logging

```typescript
console.log(`[Phase 1] Starting deep reading...`);
console.log(`[Phase 1] Extracted ${tokens} tokens from PDF`);
console.log(`[Phase 2] Running specialized analyses in parallel...`);
console.log(`[Analysis Complete] Total cost: $${cost.toFixed(2)}`);
```

## Commands

```bash
# Instalar dependências
bun install

# Testar configuração
bun run test

# Análise via CLI
bun run analyze

# API server
bun run api

# Dev mode (watch)
bun run dev
```

## Environment Variables

### Required
- `AI_PROVIDER` - Provider a usar
- `[PROVIDER]_API_KEY` - API key do provider escolhido
- `[PROVIDER]_MODEL` - Modelo a usar

### Optional
- `ENABLE_THINKING` - Ativar extended thinking
- `THINKING_BUDGET_FASE*` - Budget por fase
- `MAX_TOKENS` - Limite de tokens
- `TEMPERATURE` - Temperatura (0.0-1.0)

## Best Practices

### DO ✅

- Sempre validar config antes de usar
- Usar extended thinking para modelos que suportam
- Fazer error handling em todas as chamadas de API
- Logar progresso das fases
- Limitar tamanho do PDF (truncate se necessário)
- Salvar resultados em JSON e Markdown
- Usar types adequados (nunca `any`)
- Fazer fallback para provider alternativo se falhar

### DON'T ❌

- Hardcode API keys
- Ignorar erros de API
- Processar PDFs > 50MB sem aviso
- Usar modelos sem reasoning para análise profunda
- Esquecer de atualizar progress callbacks
- Deixar console.logs desnecessários
- Fazer múltiplas chamadas quando pode paralelizar

## Performance Tips

1. **Parallel Execution**
   ```typescript
   const [legal, tecnica, impactos, mitigacao] = await Promise.all([
     this.analiseLegal(texto, contexto),
     this.analiseTecnica(texto, contexto),
     this.analiseImpactos(texto, contexto),
     this.analiseMitigacao(texto, contexto),
   ]);
   ```

2. **Token Optimization**
   - Truncar texto se necessário
   - Usar chunking para PDFs grandes
   - Ajustar thinking budget baseado na fase

3. **Caching**
   - Cache de PDFs extraídos
   - Cache de contexto da Fase 1
   - Reutilizar análises quando possível

## Testing

```typescript
// Test provider
const provider = createAIProvider("deepseek");
const response = await provider.generateResponse({
  messages: [{ role: "user", content: "Test" }],
});
console.log(response);

// Test extraction
const doc = await extractPDF("path/to/file.pdf");
console.log(`Pages: ${doc.totalPages}, Tokens: ~${doc.rawText.length / 4}`);
```

## Troubleshooting

### API Key Issues
```bash
# Verificar se a key está setada
echo $DEEPSEEK_API_KEY

# Testar configuração
bun run test
```

### PDF Extraction Issues
- Verificar se o PDF não está criptografado
- Tamanho máximo: 50MB
- Formato suportado: PDF 1.4+

### Memory Issues
- Reduzir MAX_TOKENS
- Truncar PDFs grandes
- Processar em chunks

### Provider Timeouts
- Aumentar timeout da API
- Usar modelo mais rápido
- Reduzir thinking budget

## Security

- ⚠️ Nunca commitar .env
- ⚠️ Rotacionar API keys regularmente
- ⚠️ Validar inputs de usuário
- ⚠️ Rate limiting na API
- ⚠️ HTTPS obrigatório em produção

## Cost Optimization

- DeepSeek R1: ~$0.55/1M input tokens
- Usar thinking budget adequado (não excessivo)
- Cache quando possível
- Escolher modelo adequado para tarefa
- Monitorar custos por análise

---

**Mantenha a qualidade da análise como prioridade #1!**
