// Types for Convex database records

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

export interface AnalysisResult {
  notaGeral?: number;
  classificacao?: string;
  problemasCriticos?: number;
  fase1?: any;
  fase2?: any;
  fase3?: any;
  fase4?: any;
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
