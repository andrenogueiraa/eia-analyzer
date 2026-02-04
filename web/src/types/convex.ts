// Types for Convex database records
import type { Id } from "@/../convex/_generated/dataModel";

export interface AnalysisConfig {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  enableThinking: boolean;
  thinkingBudget: number;
}

export interface Study {
  _id: Id<"studies">;
  _creationTime: number;
  fileName: string;
  fileId: Id<"_storage">;
  fileSize: number;
  createdAt: number;
  description?: string;
}

export interface StudyWithAnalyses extends Study {
  analyses: Analysis[];
}

export interface StudyWithCounts extends Study {
  analysisCount: number;
  completedCount: number;
  processingCount: number;
  latestAnalysis: Analysis | null;
}

export interface Analysis {
  _id: Id<"analyses">;
  _creationTime: number;
  studyId: Id<"studies">;
  config: AnalysisConfig;
  status: "pending" | "processing" | "completed" | "failed";
  progress?: {
    phase: number;
    phaseName: string;
    percentage: number;
  };
  result?: AnalysisResult;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  cost?: number;
}

export interface AnalysisWithStudy extends Analysis {
  study: Study | null;
}

export interface AnalysisResult {
  notaGeral?: number;
  classificacao?: string;
  problemasCriticos?: number;
  fase1?: unknown;
  fase2?: unknown;
  fase3?: unknown;
  fase4?: unknown;
  recomendacoes?: string[];
}

export interface AnalysisStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalCost: number;
}

export interface StudyStats {
  totalStudies: number;
  totalAnalyses: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalCost: number;
}
