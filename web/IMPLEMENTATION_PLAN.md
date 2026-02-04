# EIA Analysis Web Interface - Implementation Plan

## Stack
- **Frontend**: React + TanStack Router + Vite + Tailwind CSS
- **Backend**: Convex (database + file storage + real-time)
- **Runtime**: Bun
- **Analysis Engine**: Existing TypeScript backend (../src)

## Architecture

```
┌─────────────────────────────────────────────┐
│           Web Interface (React)             │
│  - Dashboard (list analyses)                │
│  - Upload page (drag & drop PDF)            │
│  - Analysis detail view (report)            │
│  - Real-time progress tracking              │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│            Convex Backend                   │
│  - Store analysis metadata                  │
│  - Store PDF files (file storage)           │
│  - Real-time subscriptions                  │
│  - HTTP endpoints for triggers              │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│        Analysis Engine (../src)             │
│  - Existing TypeScript analysis system      │
│  - Triggered via Convex actions             │
│  - Streams progress back to Convex          │
└─────────────────────────────────────────────┘
```

## Database Schema (Convex)

```typescript
// analyses table
{
  _id: Id<"analyses">,
  fileName: string,
  fileId: Id<"_storage">,  // Convex file storage
  status: "pending" | "processing" | "completed" | "failed",
  progress: {
    phase: number,
    phaseName: string,
    percentage: number
  },
  result: {
    documentoAnalisado: string,
    dataAnalise: Date,
    contexto: {...},
    analisesEspecializadas: [...],
    verificacao: {...},
    conclusoes: string,
    // ... full report
  },
  createdAt: number,
  completedAt?: number,
  error?: string
}
```

## Features

### 1. Dashboard (/)
- List all analyses (grid/list view)
- Show status badges (pending/processing/completed/failed)
- Real-time updates when analysis completes
- Search and filter

### 2. Upload Page (/upload)
- Drag & drop PDF upload
- File validation (PDF only, max 50MB)
- Upload to Convex storage
- Trigger analysis
- Redirect to analysis detail page

### 3. Analysis Detail (/analysis/:id)
- Real-time progress bar
- Phase-by-phase progress (Fase 1, 2, 3, 4)
- When complete, show full report:
  - Executive summary
  - Critical problems
  - Specialized analyses
  - Recommendations
- Download report (JSON/MD)
- Markdown renderer for report

### 4. Real-time Progress
- WebSocket connection via Convex
- Live updates during analysis
- Progress percentage per phase
- ETA estimation

## Implementation Steps

### Step 1: Setup Convex
```bash
cd web
bunx convex dev
```

### Step 2: Create Schema
- Define analyses table
- Configure file storage

### Step 3: Create Backend Functions
- `uploadPDF`: Store file, create analysis record
- `getAnalyses`: Query all analyses
- `getAnalysis`: Get single analysis with file
- `updateProgress`: Update analysis progress
- `completeAnalysis`: Store final result

### Step 4: Integrate Analysis Engine
- Create Convex action to trigger analysis
- Stream progress from analysis engine to Convex
- Handle errors and retries

### Step 5: Build Frontend
- Setup TanStack Router
- Create routes
- Build components
- Style with Tailwind

### Step 6: Connect Everything
- Upload triggers analysis
- Real-time progress updates
- Display results

## Cost Estimation
- Convex: Free tier (1M function calls/mo, 1GB storage)
- DeepSeek API: ~$5-8 per analysis
- Hosting: Deploy to Vercel/Netlify (free tier)

## Next Actions
1. Initialize Convex: `bunx convex dev`
2. Create schema
3. Build basic UI
4. Integrate analysis engine
5. Test end-to-end
6. Deploy

---

**Status**: Ready to implement
**Estimated time**: 4-6 hours for MVP
