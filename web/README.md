# 🌿 EIA Analysis - Web Interface

Modern web interface for automated Environmental Impact Assessment (EIA) analysis.

## Stack

- **Frontend**: React 19 + TanStack Router + Vite + Tailwind CSS
- **Backend**: Convex (serverless, real-time database)
- **Runtime**: Bun
- **Analysis Engine**: DeepSeek R1 AI

## Features

- 📤 Drag & drop PDF upload
- 📊 Real-time analysis progress tracking
- 📈 Interactive dashboard
- 📄 Beautiful report viewer
- 🔄 Real-time updates via WebSocket
- 💾 Analysis history
- 📥 Download reports (JSON/Markdown)

## Quick Start

### 1. Setup Convex

```bash
cd web

# Initialize Convex (requires account at convex.dev)
bunx convex dev

# This will:
# - Create a Convex project
# - Generate convex/ directory
# - Start local dev server
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Run Development Server

```bash
# Terminal 1: Convex backend
bunx convex dev

# Terminal 2: Vite frontend
bun dev
```

Open http://localhost:5173

## Project Structure

```
web/
├── convex/              # Convex backend
│   ├── schema.ts        # Database schema
│   ├── analyses.ts      # Analysis CRUD operations
│   └── http.ts          # HTTP endpoints
│
├── src/
│   ├── routes/          # TanStack Router pages
│   │   ├── __root.tsx   # Root layout
│   │   ├── index.tsx    # Dashboard
│   │   ├── upload.tsx   # Upload page
│   │   └── analysis.$id.tsx  # Analysis detail
│   │
│   ├── components/      # React components
│   │   ├── upload-zone.tsx
│   │   ├── analysis-card.tsx
│   │   ├── progress-tracker.tsx
│   │   └── report-viewer.tsx
│   │
│   ├── lib/
│   │   ├── convex.ts    # Convex client setup
│   │   └── utils.ts     # Utilities
│   │
│   └── main.tsx         # App entry point
│
└── public/              # Static assets
```

## How It Works

1. **Upload**: User uploads PDF → stored in Convex file storage
2. **Trigger**: Convex action triggers analysis engine (parent ../src)
3. **Process**: Analysis runs with 4 phases, streaming progress
4. **Update**: Real-time progress updates via Convex subscriptions
5. **Complete**: Full report stored and displayed

## Development Status

🚧 **Currently**: Base structure created, ready for implementation

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for detailed next steps.

## Deployment

### Deploy Convex Backend

```bash
bunx convex deploy
```

### Deploy Frontend (Vercel)

```bash
# Install Vercel CLI
bun add -g vercel

# Deploy
vercel
```

## Cost

- **Convex**: Free tier (1M function calls/mo, 1GB storage)
- **DeepSeek API**: ~$5-8 per 100-page EIA
- **Vercel**: Free tier (100GB bandwidth/mo)

**Total**: Essentially free for moderate usage!

---

Built with ❤️ using Bun + React + Convex + AI
