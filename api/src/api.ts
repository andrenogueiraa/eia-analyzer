import express from "express";
import cors from "cors";
import { createWriteStream, unlinkSync, appendFileSync } from "fs";
import { pipeline } from "stream/promises";
import { extractPDF } from "./extractor";
import { AnalisadorEIA } from "./agents";
import { createAIProvider, createAIProviderWithConfig } from "./ai-provider";
import { config } from "./config";
import type { AnalysisConfig } from "./types";

// Log function that writes to file and console
const logFile = "/tmp/api-analysis.log";
function log(message: string) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;
  console.log(message);
  try {
    appendFileSync(logFile, line);
  } catch {}
}

const app = express();

// Enable CORS for Convex
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Error handling for body parsing
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err) {
    console.error("Body parsing error:", err.message);
    return res.status(400).json({ error: err.message });
  }
  next();
});

interface AnalysisProgress {
  phase: number;
  phaseName: string;
  percentage: number;
}

// Webhook to report progress back to Convex
let progressCallback: ((progress: AnalysisProgress) => Promise<void>) | null =
  null;

// POST /analyze - Start analysis
app.post("/analyze", async (req, res) => {
  try {
    const { fileUrl, analysisId, callbackUrl, config: reqConfig } = req.body;

    if (!fileUrl || !analysisId) {
      return res.status(400).json({
        error: "Missing required fields: fileUrl, analysisId",
      });
    }

    // Set up progress callback
    if (callbackUrl) {
      progressCallback = async (progress: AnalysisProgress) => {
        try {
          await fetch(callbackUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ analysisId, progress }),
          });
        } catch (err) {
          console.error("Failed to send progress update:", err);
        }
      };
    }

    // Start analysis in background with config
    processAnalysis(fileUrl, analysisId, callbackUrl, reqConfig).catch((err) => {
      console.error("Analysis failed:", err);
    });

    // Return immediately
    res.json({
      success: true,
      message: "Analysis started",
      analysisId,
    });
  } catch (error) {
    console.error("Error starting analysis:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

async function processAnalysis(
  fileUrl: string,
  analysisId: string,
  callbackUrl?: string,
  analysisConfig?: AnalysisConfig
) {
  const tempFilePath = `/tmp/analysis-${analysisId}.pdf`;

  try {
    // Download file
    log(`Downloading file from ${fileUrl}...`);
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const fileStream = createWriteStream(tempFilePath);
    await pipeline(response.body as any, fileStream);

    // Extract PDF
    log("Extracting PDF...");
    await sendProgress(callbackUrl, analysisId, {
      phase: 1,
      phaseName: "Extracao do PDF",
      percentage: 10,
    });
    const documento = await extractPDF(tempFilePath);
    log(`PDF extracted: ${documento.totalPages} pages, ${documento.rawText.length} chars`);

    // Run analysis with dynamic config or default
    log("Starting analysis...");
    if (analysisConfig) {
      log(`Using config: provider=${analysisConfig.provider}, model=${analysisConfig.model}`);
    }

    const provider = analysisConfig
      ? createAIProviderWithConfig(analysisConfig)
      : createAIProvider();

    const analisador = new AnalisadorEIA(provider, analysisConfig);

    // Phase 1: Deep Reading
    await sendProgress(callbackUrl, analysisId, {
      phase: 1,
      phaseName: "Leitura Profunda",
      percentage: 25,
    });
    log("Calling analisador.analisar()...");
    const resultado = await analisador.analisar(documento);
    log("Analysis returned successfully");

    // Phase 2: Specialized Analysis
    await sendProgress(callbackUrl, analysisId, {
      phase: 2,
      phaseName: "Analise Especializada",
      percentage: 50,
    });

    // Phase 3: Cross-validation
    await sendProgress(callbackUrl, analysisId, {
      phase: 3,
      phaseName: "Verificacao Cruzada",
      percentage: 75,
    });

    // Phase 4: Consolidation
    await sendProgress(callbackUrl, analysisId, {
      phase: 4,
      phaseName: "Consolidacao Final",
      percentage: 90,
    });

    // Send completion
    log("Analysis complete!");
    await sendCompletion(callbackUrl, analysisId, resultado);

    // Cleanup
    unlinkSync(tempFilePath);
  } catch (error) {
    log(`Analysis error: ${error instanceof Error ? error.stack : error}`);
    await sendError(
      callbackUrl,
      analysisId,
      error instanceof Error ? error.message : "Unknown error"
    );

    // Cleanup on error
    try {
      unlinkSync(tempFilePath);
    } catch {}
  }
}

async function sendProgress(
  callbackUrl: string | undefined,
  analysisId: string,
  progress: AnalysisProgress
) {
  if (!callbackUrl) return;

  try {
    await fetch(callbackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "progress",
        analysisId,
        progress,
      }),
    });
  } catch (err) {
    console.error("Failed to send progress:", err);
  }
}

async function sendCompletion(
  callbackUrl: string | undefined,
  analysisId: string,
  result: any
) {
  if (!callbackUrl) return;

  try {
    await fetch(callbackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "complete",
        analysisId,
        result,
      }),
    });
  } catch (err) {
    console.error("Failed to send completion:", err);
  }
}

async function sendError(
  callbackUrl: string | undefined,
  analysisId: string,
  error: string
) {
  if (!callbackUrl) return;

  try {
    await fetch(callbackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "error",
        analysisId,
        error,
      }),
    });
  } catch (err) {
    console.error("Failed to send error:", err);
  }
}

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.API_PORT || 3001;

app.listen(PORT, () => {
  console.log(`Analysis API running on http://localhost:${PORT}`);
  console.log(`   Default Provider: ${config.provider}`);
  console.log(`   Default Model: ${config.models[config.provider as keyof typeof config.models]}`);
});
