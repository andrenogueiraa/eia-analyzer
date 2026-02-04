# 🌿 EIA Analyzer - Sistema de Análise de Estudos de Impacto Ambiental

Sistema completo para análise automatizada de Estudos de Impacto Ambiental (EIA) usando IA.

## 📁 Estrutura do Projeto

```
analise-estudo/
├── api/              # Backend - API de análise
│   ├── src/         # Código fonte da análise
│   ├── data/        # Dados de entrada/saída
│   ├── logs/        # Logs da aplicação
│   └── package.json
│
└── web/             # Frontend - Interface web
    ├── src/         # Código React
    ├── convex/      # Backend Convex (DB + Actions)
    └── package.json
```

## 🚀 Tecnologias

### Backend (API)
- **Runtime:** Bun
- **Framework:** Express
- **IA:** DeepSeek R1 (Reasoning Model)
- **PDF:** pdf-parse

### Frontend (Web)
- **Framework:** React 19 + Vite
- **Routing:** TanStack Router
- **Styling:** Tailwind CSS v4
- **Database:** Convex (Serverless, Real-time)
- **Icons:** Lucide React

## 📋 Pré-requisitos

- Bun 1.0+
- Node.js 18+ (para Convex)
- Conta Convex (gratuita)
- API Key do DeepSeek

## ⚙️ Configuração

### 1. Instalar dependências

```bash
# API
cd api
bun install

# Web
cd web
bun install
```

### 2. Configurar variáveis de ambiente

#### API (`api/.env`)
```env
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=sua-chave-aqui
DEEPSEEK_MODEL=deepseek-reasoner
ENABLE_THINKING=true
THINKING_BUDGET_FASE1=5000
THINKING_BUDGET_FASE2=3000
THINKING_BUDGET_FASE3=2000
THINKING_BUDGET_FASE4=5000
MAX_TOKENS=16000
TEMPERATURE=0.3
```

#### Web (`web/.env.local`)
```env
VITE_CONVEX_URL=https://sua-url.convex.cloud
VITE_CONVEX_SITE_URL=https://sua-url.convex.site
```

### 3. Inicializar Convex

```bash
cd web
bunx convex dev
```

Siga as instruções para criar um projeto Convex.

## 🎯 Como Usar

### 1. Iniciar os serviços

**Terminal 1 - API de Análise:**
```bash
cd api
bun run api
```

**Terminal 2 - Convex Dev:**
```bash
cd web
bunx convex dev
```

**Terminal 3 - Web Interface:**
```bash
cd web
bun dev
```

### 2. Acessar a interface

Abra http://localhost:5173 no navegador.

### 3. Fazer upload e analisar

1. Arraste um PDF de EIA para a área de upload
2. Clique em **"Iniciar"** para começar a análise
3. Acompanhe o progresso em tempo real
4. Visualize o resultado quando concluído

## 🔄 Fluxo de Análise

O sistema realiza análise em **4 fases**:

1. **Leitura Profunda** - Extração e compreensão do documento
2. **Análise Especializada** - 4 análises paralelas:
   - Conformidade Legal
   - Qualidade Técnica
   - Avaliação de Impactos
   - Medidas Mitigadoras
3. **Verificação Cruzada** - Validação entre análises
4. **Consolidação Final** - Relatório integrado com notas e recomendações

## 📊 Recursos

- ✅ Upload de PDF drag & drop
- ✅ Análise com IA reasoning (DeepSeek R1)
- ✅ Progresso em tempo real
- ✅ Dashboard com estatísticas
- ✅ Banco de dados real-time (Convex)
- ✅ Interface responsiva (Tailwind)
- ✅ Multi-provider IA (DeepSeek, OpenAI, Anthropic, etc.)

## 🛠️ Scripts Úteis

### API
```bash
bun run api          # Iniciar servidor API
bun run analyze      # Análise via CLI
bun run test         # Testar configuração
```

### Web
```bash
bun dev              # Dev server
bun build            # Build para produção
bunx convex dev      # Convex dev server
bunx convex deploy   # Deploy Convex
```

## 📝 Estrutura de Dados

### Analysis Record (Convex)
```typescript
{
  fileName: string
  fileId: Id<"_storage">
  fileSize: number
  status: "pending" | "processing" | "completed" | "failed"
  progress?: {
    phase: number
    phaseName: string
    percentage: number
  }
  result?: any
  error?: string
  createdAt: number
  completedAt?: number
  cost?: number
}
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é open source.

## 👤 Autor

Andre Nogueira

## 🙏 Agradecimentos

- DeepSeek AI pelo modelo R1 com reasoning
- Convex pela plataforma real-time
- TanStack Router pela navegação
- Tailwind CSS pelo design system

---

**Desenvolvido com ❤️ usando Bun + React + Convex + DeepSeek AI**
