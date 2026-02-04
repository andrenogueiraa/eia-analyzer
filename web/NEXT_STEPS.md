# 🚀 Next Steps - Build the EIA Analysis Web App

This guide will walk you through completing the web interface implementation.

## Current Status

✅ **Completed:**
- Vite + React + TypeScript setup
- Tailwind CSS configured
- TanStack Router plugin installed
- Convex dependencies installed
- Project structure created
- Implementation plan documented

🚧 **To Do:**
- Initialize Convex
- Create database schema
- Build frontend components
- Integrate with analysis engine
- Deploy

---

## Step 1: Initialize Convex (15 minutes)

### 1.1 Create Convex Account

Visit [convex.dev](https://convex.dev) and sign up (free).

### 1.2 Initialize Convex Project

```bash
cd web
bunx convex dev
```

This will:
- Prompt you to login
- Create a new Convex project
- Generate `convex/` directory
- Create `.env.local` with `VITE_CONVEX_URL`
- Start the Convex dev server

### 1.3 Create Database Schema

Create `convex/schema.ts`:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  analyses: defineTable({
    fileName: v.string(),
    fileId: v.id("_storage"),
    fileSize: v.number(),
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
    result: v.optional(v.any()), // Full analysis result
    error: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    cost: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),
});
```

---

## Step 2: Create Convex Functions (30 minutes)

### 2.1 Upload Function

Create `convex/analyses.ts`:

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all analyses
export const list = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("analyses")
      .order("desc")
      .collect();
  },
});

// Get single analysis
export const get = query({
  args: { id: v.id("analyses") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create new analysis
export const create = mutation({
  args: {
    fileName: v.string(),
    fileId: v.id("_storage"),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("analyses", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

// Update progress
export const updateProgress = mutation({
  args: {
    id: v.id("analyses"),
    phase: v.number(),
    phaseName: v.string(),
    percentage: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, ...progress } = args;
    await ctx.db.patch(id, {
      status: "processing",
      progress,
    });
  },
});

// Complete analysis
export const complete = mutation({
  args: {
    id: v.id("analyses"),
    result: v.any(),
    cost: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "completed",
      result: args.result,
      cost: args.cost,
      completedAt: Date.now(),
    });
  },
});

// Mark as failed
export const fail = mutation({
  args: {
    id: v.id("analyses"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "failed",
      error: args.error,
    });
  },
});
```

---

## Step 3: Create Frontend Components (1-2 hours)

### 3.1 Setup Convex Client

Create `src/lib/convex.tsx`:

```typescript
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
```

### 3.2 Create Utils

Create `src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${minutes}m ${secs}s`;
}
```

### 3.3 Create Upload Component

Create `src/components/upload-zone.tsx`:

```typescript
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { cn } from "../lib/utils";

interface UploadZoneProps {
  onUpload: (file: File) => void;
  disabled?: boolean;
}

export function UploadZone({ onUpload, disabled }: UploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles[0]) {
        onUpload(acceptedFiles[0]);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
        isDragActive && "border-primary bg-primary/5",
        !isDragActive && "border-gray-300 hover:border-primary",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      {isDragActive ? (
        <p className="text-lg">Solte o PDF aqui...</p>
      ) : (
        <>
          <p className="text-lg mb-2">
            Arraste um PDF aqui, ou clique para selecionar
          </p>
          <p className="text-sm text-gray-500">
            Apenas arquivos PDF, máximo 50MB
          </p>
        </>
      )}
    </div>
  );
}
```

### 3.4 Create Analysis Card

Create `src/components/analysis-card.tsx`:

```typescript
import { Link } from "@tanstack/react-router";
import { FileText, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { formatDistance } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatBytes } from "../lib/utils";

interface Analysis {
  _id: string;
  fileName: string;
  fileSize: number;
  status: "pending" | "processing" | "completed" | "failed";
  progress?: {
    phase: number;
    percentage: number;
  };
  createdAt: number;
  completedAt?: number;
}

export function AnalysisCard({ analysis }: { analysis: Analysis }) {
  const statusConfig = {
    pending: { icon: Clock, color: "text-yellow-500", label: "Pendente" },
    processing: { icon: Loader2, color: "text-blue-500", label: "Processando" },
    completed: { icon: CheckCircle, color: "text-green-500", label: "Concluído" },
    failed: { icon: XCircle, color: "text-red-500", label: "Falhou" },
  };

  const { icon: Icon, color, label } = statusConfig[analysis.status];

  return (
    <Link
      to="/analysis/$id"
      params={{ id: analysis._id }}
      className="block p-6 bg-white border rounded-lg hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-gray-400" />
          <div>
            <h3 className="font-semibold text-lg">{analysis.fileName}</h3>
            <p className="text-sm text-gray-500">{formatBytes(analysis.fileSize)}</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 ${color}`}>
          <Icon className={analysis.status === "processing" ? "animate-spin" : ""} />
          <span className="text-sm font-medium">{label}</span>
        </div>
      </div>

      {analysis.progress && analysis.status === "processing" && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Fase {analysis.progress.phase} de 4</span>
            <span>{analysis.progress.percentage}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${analysis.progress.percentage}%` }}
            />
          </div>
        </div>
      )}

      <div className="text-sm text-gray-500">
        {formatDistance(analysis.createdAt, Date.now(), {
          addSuffix: true,
          locale: ptBR,
        })}
      </div>
    </Link>
  );
}
```

---

## Step 4: Create Routes (1 hour)

### 4.1 Root Layout

Create `src/routes/__root.tsx`:

```typescript
import { Outlet, Link } from "@tanstack/react-router";
import { Leaf } from "lucide-react";

export function Route() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <Leaf className="h-6 w-6 text-green-600" />
            EIA Analyzer
          </Link>
          <nav className="flex gap-4">
            <Link to="/" className="hover:text-green-600">
              Dashboard
            </Link>
            <Link to="/upload" className="hover:text-green-600">
              Upload
            </Link>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
```

### 4.2 Dashboard Route

Create `src/routes/index.tsx`:

```typescript
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { AnalysisCard } from "../components/analysis-card";
import { Link } from "@tanstack/react-router";
import { Upload } from "lucide-react";

export function Route() {
  const analyses = useQuery(api.analyses.list);

  if (!analyses) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Análises de EIA</h1>
        <Link
          to="/upload"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Upload className="h-5 w-5" />
          Nova Análise
        </Link>
      </div>

      {analyses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Nenhuma análise ainda</p>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Upload className="h-5 w-5" />
            Fazer Upload do Primeiro EIA
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {analyses.map((analysis) => (
            <AnalysisCard key={analysis._id} analysis={analysis} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Step 5: Integrate Analysis Engine (2 hours)

This is the most complex part. You'll need to create a bridge between the web app and the analysis engine.

### Option A: HTTP API (Recommended)

Create a simple HTTP server in the parent directory that the web app can call:

```typescript
// In parent /src/api.ts
import express from "express";
import { AnalisadorEIA } from "./agents";

const app = express();

app.post("/analyze", async (req, res) => {
  // Get PDF from request
  // Run analysis
  // Stream progress back
  // Return result
});

app.listen(3000);
```

### Option B: Convex Actions

Run the analysis directly from Convex actions (requires copying analysis code to convex/).

---

## Step 6: Deploy (30 minutes)

### 6.1 Deploy Convex

```bash
bunx convex deploy
```

### 6.2 Deploy Frontend to Vercel

```bash
vercel
```

---

## Quick Reference

### Useful Commands

```bash
# Start Convex dev server
bunx convex dev

# Start Vite dev server
bun dev

# Build for production
bun run build

# Deploy Convex
bunx convex deploy

# Deploy to Vercel
vercel
```

### Useful Links

- [Convex Docs](https://docs.convex.dev)
- [TanStack Router Docs](https://tanstack.com/router)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

## Estimated Timeline

- **Step 1** (Convex setup): 15 min
- **Step 2** (Backend functions): 30 min
- **Step 3** (Frontend components): 1-2 hours
- **Step 4** (Routes): 1 hour
- **Step 5** (Integration): 2 hours
- **Step 6** (Deploy): 30 min

**Total**: 5-7 hours for complete MVP

---

## Need Help?

- Check `IMPLEMENTATION_PLAN.md` for architecture details
- See Convex docs for database questions
- Refer to parent `../src` for analysis engine code

Good luck! 🚀
