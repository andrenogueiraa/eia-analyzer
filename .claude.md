# EIA Analyzer - Development Guide

Sistema de análise automatizada de Estudos de Impacto Ambiental (EIA) usando IA.

## Estrutura do Monorepo

```
analise-estudo/
├── api/              # Backend - API de análise com IA
├── web/              # Frontend - Interface web com Convex
├── .gitignore        # Ignores do repositório
└── README.md         # Documentação principal
```

## Princípios Gerais

### TypeScript

- **SEMPRE** usar TypeScript strict mode
- **NUNCA** usar `any` - criar tipos adequados
- **SEMPRE** tipar parâmetros, retornos e variáveis
- Preferir interfaces sobre types quando possível
- Usar tipos utilitários (Partial, Pick, Omit, etc.)

### Git & Commits

- **Commits semânticos:**
  - `feat:` - Nova funcionalidade
  - `fix:` - Correção de bug
  - `refactor:` - Refatoração de código
  - `docs:` - Documentação
  - `style:` - Formatação, espaços em branco
  - `test:` - Testes
  - `chore:` - Tarefas de manutenção

- **Formato do commit:**
  ```
  tipo: Título curto (50 chars)

  Descrição detalhada do que foi feito e por quê.
  Pode ter múltiplas linhas.

  Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
  ```

### Code Style

- Usar **Prettier** para formatação
- Usar **ESLint** para linting
- Indentação: 2 espaços
- Quotes: aspas duplas para strings
- Semicolons: sim
- Trailing commas: sempre

### Boas Práticas

1. **DRY (Don't Repeat Yourself)**
   - Extrair código duplicado em funções/componentes
   - Criar utilities para lógica reutilizável

2. **KISS (Keep It Simple, Stupid)**
   - Preferir soluções simples
   - Evitar over-engineering
   - Código legível > código "inteligente"

3. **YAGNI (You Aren't Gonna Need It)**
   - Não adicionar features especulativas
   - Implementar apenas o necessário

4. **Separation of Concerns**
   - UI separada da lógica de negócio
   - Componentes focados em uma responsabilidade
   - Funções puras quando possível

## Arquitetura

### Backend (API)
- Runtime: Bun
- Framework: Express
- IA: Multi-provider (DeepSeek, OpenAI, Anthropic, OpenRouter)
- PDF: pdf-parse

### Frontend (Web)
- Framework: React 19 + Vite
- Routing: TanStack Router (file-based)
- Styling: Tailwind CSS v4
- Components: shadcn/ui
- Database: Convex (serverless, real-time)
- Icons: Lucide React + Iconify

## Comandos Úteis

```bash
# Verificar TypeScript em todo projeto
bun tsc

# Testar configuração
cd api && bun run test

# Iniciar serviços (3 terminais)
cd api && bun run api          # Terminal 1
cd web && bunx convex dev      # Terminal 2
cd web && bun dev              # Terminal 3
```

## Regras de Desenvolvimento

### DO ✅

- Sempre ler arquivos antes de editar
- Usar componentes shadcn/ui quando disponíveis
- Tipar tudo adequadamente
- Escrever código auto-documentado
- Usar path aliases (@/) para imports
- Criar tipos customizados quando necessário
- Seguir convenções de nomenclatura:
  - Componentes: PascalCase
  - Funções: camelCase
  - Constantes: UPPER_SNAKE_CASE
  - Arquivos: kebab-case ou PascalCase (componentes)

### DON'T ❌

- Usar `any` no TypeScript
- Fazer commits sem mensagem descritiva
- Adicionar features não solicitadas
- Quebrar funcionalidades existentes
- Ignorar erros do TypeScript
- Usar imports relativos longos (../../..)
- Commitar código comentado desnecessariamente
- Deixar console.logs no código de produção

## Convenções de Nomenclatura

### Arquivos
- Componentes React: `PascalCase.tsx`
- Utilities: `kebab-case.ts`
- Types: `types.ts` ou `types/`
- Hooks: `use-feature-name.ts`

### Código
- Componentes: `PascalCase`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Interfaces/Types: `PascalCase`
- Props interfaces: `ComponentNameProps`

## Estrutura de Componentes React

```typescript
// Imports organizados
import { useState } from "react";
import { ComponentDependency } from "library";
import { LocalComponent } from "@/components/local";
import type { PropsType } from "@/types";

// Interface de props
interface ComponentNameProps {
  prop1: string;
  prop2?: number;
  onAction: () => void;
}

// Componente
export function ComponentName({ prop1, prop2, onAction }: ComponentNameProps) {
  // Hooks no topo
  const [state, setState] = useState<string>("");

  // Handlers
  const handleAction = () => {
    // Lógica
  };

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

## Error Handling

```typescript
// Sempre tipar errors
try {
  await riskyOperation();
} catch (error) {
  if (error instanceof Error) {
    console.error("Operation failed:", error.message);
  } else {
    console.error("Unknown error:", error);
  }
}
```

## Async/Await

- Preferir `async/await` sobre `.then()`
- Sempre fazer error handling
- Usar `Promise.all()` para operações paralelas

## Performance

- Usar React.memo() quando apropriado
- Otimizar re-renders com useCallback/useMemo
- Lazy loading para rotas/componentes pesados
- Debounce para inputs de busca
- Virtualização para listas grandes

## Acessibilidade

- Sempre usar labels em inputs
- ARIA labels quando necessário
- Keyboard navigation funcional
- Semantic HTML
- Contrast ratio adequado

## Segurança

- Nunca commitar secrets (.env no .gitignore)
- Validar inputs do usuário
- Sanitizar dados antes de exibir
- HTTPS em produção
- Rate limiting na API

## Testing

- Testar funcionalidades críticas
- Testes unitários para lógica complexa
- E2E para fluxos principais
- Mocks para chamadas externas

## Deploy

### Web (Vercel)
```bash
cd web
vercel
```

### API (Fly.io ou similar)
```bash
cd api
# Configurar deploy específico
```

### Convex
```bash
cd web
bunx convex deploy
```

## Troubleshooting

### TypeScript errors
```bash
bun tsc --noEmit
```

### Build errors
```bash
cd web
rm -rf node_modules .convex _generated
bun install
bunx convex dev
```

### Git conflicts
```bash
git status
git diff
# Resolver conflitos manualmente
git add .
git commit
```

## Resources

- [React Docs](https://react.dev)
- [TanStack Router](https://tanstack.com/router)
- [Convex Docs](https://docs.convex.dev)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)

---

**Mantenha este guia atualizado conforme o projeto evolui!**
