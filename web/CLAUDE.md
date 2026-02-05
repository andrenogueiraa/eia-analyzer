# Web - EIA Analyzer Frontend

Interface web moderna para análise de EIA com real-time updates.

## Stack Tecnológico

- **Framework:** React 19
- **Build Tool:** Vite
- **Language:** TypeScript (strict)
- **Routing:** TanStack Router (file-based)
- **Styling:** Tailwind CSS v4
- **Components:** shadcn/ui
- **Database:** Convex (serverless, real-time)
- **Icons:** Lucide React + @iconify/react
- **Charts:** Recharts
- **PDF Export:** pdfmake
- **Markdown:** react-markdown
- **State:** React Hooks + Convex queries

## Estrutura de Diretórios

```
web/
├── src/
│   ├── routes/               # TanStack Router (file-based)
│   │   ├── __root.tsx       # Layout raiz (header/footer)
│   │   ├── index.tsx        # Dashboard (lista de estudos)
│   │   ├── about.tsx        # Metodologia de análise
│   │   ├── models.tsx       # Providers e modelos disponíveis
│   │   ├── study.$id.tsx    # Detalhes do estudo
│   │   └── analysis.$id.tsx # Resultado da análise
│   ├── components/
│   │   ├── ui/              # shadcn/ui components (18+)
│   │   ├── upload-zone.tsx  # Upload drag & drop
│   │   └── analysis-config-dialog.tsx  # Config modal
│   ├── lib/
│   │   ├── utils.ts         # Utility functions (cn)
│   │   └── constants.ts     # Configurações de providers/models
│   ├── types/
│   │   ├── convex.ts        # Convex database types
│   │   └── pdfmake.d.ts     # Type definitions
│   ├── index.css            # Tailwind imports
│   └── main.tsx             # Entry point
├── convex/
│   ├── schema.ts            # Database schema (5 tabelas)
│   ├── analyses.ts          # CRUD de análises
│   ├── studies.ts           # CRUD de estudos
│   ├── providers.ts         # Queries de providers/models
│   ├── seed.ts              # Seeding do banco
│   ├── http.ts              # Webhook endpoints
│   └── _generated/          # Auto-generated (git ignored)
├── public/
├── .env.local               # Convex URLs (git ignored)
└── package.json
```

## Convex Setup

### Schema (convex/schema.ts)

O banco possui 5 tabelas principais:

```typescript
export default defineSchema({
  // Providers de IA (Anthropic, OpenAI, DeepSeek, OpenRouter)
  providers: defineTable({
    slug: v.string(),
    name: v.string(),
    baseUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    order: v.number(),
  }).index("by_slug", ["slug"])
    .index("by_active", ["isActive"]),

  // Modelos de IA (Claude, GPT, etc.)
  models: defineTable({
    slug: v.string(),
    name: v.string(),
    family: v.string(),
    description: v.optional(v.string()),
    contextWindow: v.number(),
    maxOutputTokens: v.number(),
    supportsThinking: v.boolean(),
    supportsTools: v.boolean(),
    supportsVision: v.boolean(),
    isActive: v.boolean(),
  }).index("by_slug", ["slug"])
    .index("by_family", ["family"]),

  // Junction: Provider + Model + Pricing
  providerModels: defineTable({
    providerId: v.id("providers"),
    modelId: v.id("models"),
    modelIdentifier: v.string(),
    inputCostPer1M: v.number(),
    outputCostPer1M: v.number(),
    thinkingCostPer1M: v.optional(v.number()),
    isDefault: v.boolean(),
    isActive: v.boolean(),
    notes: v.optional(v.string()),
  }).index("by_provider", ["providerId"])
    .index("by_model", ["modelId"]),

  // Estudos (PDFs enviados)
  studies: defineTable({
    fileName: v.string(),
    fileId: v.id("_storage"),
    fileSize: v.number(),
    description: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_created", ["createdAt"]),

  // Análises individuais
  analyses: defineTable({
    studyId: v.id("studies"),
    config: v.object({ /* provider, model, temperature, etc */ }),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    progress: v.optional(v.object({
      phase: v.number(),
      phaseName: v.string(),
      percentage: v.number(),
    })),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    cost: v.optional(v.number()),
  }).index("by_study", ["studyId"])
    .index("by_status", ["status"]),
});
```

### Functions

**convex/studies.ts** - Gestão de estudos (PDFs)
- `list` - Listar todos os estudos
- `get` - Buscar estudo por ID
- `create` - Criar novo estudo
- `generateUploadUrl` - URL para upload de arquivo

**convex/analyses.ts** - Gestão de análises
- `list` - Listar análises (filtro por estudo)
- `get` - Buscar análise por ID
- `stats` - Estatísticas gerais
- `create` - Criar nova análise
- `startAnalysis` - Action para iniciar análise na API
- `updateProgress` - Atualizar progresso (webhook)
- `complete` - Marcar como concluída (webhook)
- `fail` - Marcar como falha (webhook)

**convex/providers.ts** - Providers e modelos
- `listProviders` - Listar providers ativos
- `listModels` - Listar modelos por provider
- `getProviderModels` - Modelos com pricing
- `getPricing` - Preços por provider/model (usado pela API)

## Routing (TanStack Router)

### File-based Routes

```
routes/
  __root.tsx         → Layout (header/footer)
  index.tsx          → /           (Dashboard)
  about.tsx          → /about      (Metodologia)
  models.tsx         → /models     (Providers/Modelos)
  study.$id.tsx      → /study/:id  (Detalhes do estudo)
  analysis.$id.tsx   → /analysis/:id (Resultado da análise)
```

### Navigation

```typescript
import { Link } from "@tanstack/react-router";

// Simple link
<Link to="/">Dashboard</Link>

// With params
<Link to="/analysis/$id" params={{ id: "123" }}>
  Ver Resultado
</Link>

// With state
<Link to="/" search={{ filter: "completed" }}>
  Completed
</Link>
```

## Components (shadcn/ui)

### Installed Components (18+)

- `alert` - Alertas informativos
- `alert-dialog` - Diálogos de confirmação
- `badge` - Status badges
- `button` - Botões com variants
- `card` - Cards com header/content/footer
- `collapsible` - Seções expansíveis
- `dialog` - Modals
- `label` - Form labels
- `progress` - Progress bars
- `select` - Dropdowns
- `separator` - Separadores
- `skeleton` - Loading placeholders
- `slider` - Range inputs
- `table` - Tabelas responsivas
- `tabs` - Navegação por abas
- `tooltip` - Dicas ao passar o mouse

### Adding New Components

```bash
bunx shadcn@latest add component-name
```

### Using Components

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <Button>Click me</Button>
  </CardContent>
</Card>
```

## Styling (Tailwind CSS v4)

### Configuration

```css
/* src/index.css */
@import 'tailwindcss';
```

### Utility First

```typescript
<div className="flex items-center gap-2 p-4 bg-white rounded-lg border">
  <Icon className="w-5 h-5 text-primary" />
  <span className="text-sm font-medium">Text</span>
</div>
```

### Dark Mode

```typescript
// Automatic with shadcn
<div className="bg-white dark:bg-gray-900">
  <p className="text-gray-900 dark:text-gray-100">Text</p>
</div>
```

## State Management

### Convex Queries (Real-time)

```typescript
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";

function Component() {
  const analyses = useQuery(api.analyses.list);

  if (analyses === undefined) return <Loading />;

  return <List data={analyses} />;
}
```

### Convex Mutations

```typescript
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";

function Component() {
  const createAnalysis = useMutation(api.analyses.create);

  const handleCreate = async () => {
    await createAnalysis({
      fileName: "file.pdf",
      fileId: storageId,
      fileSize: 1234,
    });
  };
}
```

### Convex Actions

```typescript
import { useAction } from "convex/react";
import { api } from "@/../convex/_generated/api";

function Component() {
  const startAnalysis = useAction(api.analyses.startAnalysis);

  const handleStart = async (id: string) => {
    await startAnalysis({ id, callbackUrl: "..." });
  };
}
```

### Local State

```typescript
import { useState } from "react";

function Component() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>("");

  return <Dialog open={open} onOpenChange={setOpen} />;
}
```

## File Upload (Convex Storage)

```typescript
// 1. Generate upload URL
const generateUploadUrl = useMutation(api.analyses.generateUploadUrl);
const uploadUrl = await generateUploadUrl();

// 2. Upload file
const response = await fetch(uploadUrl, {
  method: "POST",
  headers: { "Content-Type": file.type },
  body: file,
});

const { storageId } = await response.json();

// 3. Create record
await createAnalysis({
  fileName: file.name,
  fileId: storageId,
  fileSize: file.size,
});
```

## Types

### Custom Types (src/types/convex.ts)

```typescript
export interface Analysis {
  _id: string;
  _creationTime: number;
  fileName: string;
  fileId: string;
  fileSize: number;
  status: "pending" | "processing" | "completed" | "failed";
  progress?: {
    phase: number;
    phaseName: string;
    percentage: number;
  };
  result?: AnalysisResult;
  error?: string;
  createdAt: number;
  completedAt?: number;
  cost?: number;
}
```

### Component Props

```typescript
interface ComponentProps {
  title: string;
  value?: number;
  onAction: (id: string) => void;
  children?: React.ReactNode;
}

function Component({ title, value = 0, onAction }: ComponentProps) {
  // ...
}
```

## Best Practices

### DO ✅

1. **Imports**
   ```typescript
   // Use path aliases
   import { Button } from "@/components/ui/button";
   import type { Analysis } from "@/types/convex";
   ```

2. **Components**
   ```typescript
   // Functional components with typed props
   interface Props {
     data: Analysis[];
   }

   export function AnalysisList({ data }: Props) {
     return <div>{/* ... */}</div>;
   }
   ```

3. **Hooks**
   ```typescript
   // Hooks no topo do componente
   const analyses = useQuery(api.analyses.list);
   const [open, setOpen] = useState(false);

   // Handlers depois
   const handleClick = () => { /* ... */ };
   ```

4. **Conditional Rendering**
   ```typescript
   if (data === undefined) return <Skeleton />;
   if (data === null) return <NotFound />;
   if (data.length === 0) return <Empty />;

   return <Content data={data} />;
   ```

5. **Error Boundaries**
   ```typescript
   try {
     await action();
   } catch (error) {
     if (error instanceof Error) {
       console.error(error.message);
     }
   }
   ```

### DON'T ❌

1. ❌ Usar `any` nos types
2. ❌ Imports relativos longos (../../..)
3. ❌ Inline styles (use Tailwind)
4. ❌ Fetch direto (use Convex)
5. ❌ Mutações sem error handling
6. ❌ console.log em produção
7. ❌ Nested ternários complexos
8. ❌ Props drilling (use Context se necessário)

## Performance

### React.memo

```typescript
import { memo } from "react";

export const AnalysisCard = memo(function AnalysisCard({ data }: Props) {
  return <Card>{/* ... */}</Card>;
});
```

### useCallback

```typescript
import { useCallback } from "react";

const handleClick = useCallback((id: string) => {
  // Handler logic
}, [dependencies]);
```

### useMemo

```typescript
import { useMemo } from "react";

const filtered = useMemo(
  () => data.filter(item => item.status === "completed"),
  [data]
);
```

## Commands

```bash
# Install dependencies
bun install

# Dev server (localhost:5173)
bun dev

# Build for production
bun build

# Preview production build
bun preview

# Convex dev server
bunx convex dev

# Convex deploy
bunx convex deploy

# Add shadcn component
bunx shadcn@latest add button

# TypeScript check
bun tsc
```

## Environment Variables

```env
# .env.local (auto-generated by convex dev)
VITE_CONVEX_URL=https://xxx.convex.cloud
VITE_CONVEX_SITE_URL=https://xxx.convex.site
```

## Accessibility

- ✅ Semantic HTML
- ✅ ARIA labels
- ✅ Keyboard navigation
- ✅ Focus indicators
- ✅ Color contrast (WCAG AA)
- ✅ Screen reader friendly

## Security

- ⚠️ Validate user inputs
- ⚠️ Sanitize data before display
- ⚠️ Use HTTPS in production
- ⚠️ Rate limiting
- ⚠️ CORS configured correctly

## Deploy

### Vercel (Recommended)

```bash
# Install Vercel CLI
bun add -g vercel

# Deploy
vercel
```

### Environment Variables (Vercel)

```
VITE_CONVEX_URL=https://production.convex.cloud
VITE_CONVEX_SITE_URL=https://production.convex.site
```

## Troubleshooting

### Build Errors

```bash
# Clear cache
rm -rf node_modules .convex _generated dist
bun install
bunx convex dev
```

### Type Errors

```bash
# Check TypeScript
bun tsc --noEmit

# Restart VS Code TypeScript server
# CMD/CTRL + Shift + P → "TypeScript: Restart TS Server"
```

### Convex Sync Issues

```bash
# Kill Convex processes
pkill -f "convex dev"

# Restart
bunx convex dev
```

## Resources

- [React 19 Docs](https://react.dev)
- [TanStack Router](https://tanstack.com/router)
- [Convex Docs](https://docs.convex.dev)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)

---

**Sempre priorize UX e performance!**
