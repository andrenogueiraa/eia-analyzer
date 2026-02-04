export interface EIADocument {
  filePath: string;
  fileName: string;
  rawText: string;
  totalPages: number;
  extractedAt: Date;
}

export interface ContextoCompleto {
  estrutura: string;
  mapaRelacoes: string;
  areasCriticas: string[];
  observacoes: string;
}

export interface AnaliseEspecializada {
  dominio: string;
  analista: string;
  conteudo: string;
  problemasCriticos: string[];
  alertas: string[];
  score?: number;
  timestamp: Date;
}

export interface VerificacaoCruzada {
  inconsistencias: string[];
  validacoes: string[];
  lacunas: string[];
  pontosReanalisar: string[];
}

export interface RelatorioFinal {
  documentoAnalisado: string;
  dataAnalise: Date;
  contexto: ContextoCompleto;
  analisesEspecializadas: AnaliseEspecializada[];
  verificacao: VerificacaoCruzada;
  conclusoes: string;
  problemasCriticos: string[];
  recomendacoes: string[];
  scoreGeral?: number;
  metadados: {
    modeloUsado: string;
    thinkingTokensUsados: number;
    tempoTotal: number;
  };
}

export interface ToolInputSchema {
  type: string;
  properties: Record<string, unknown>;
  required?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: ToolInputSchema;
}

export interface AnalisePorFase {
  fase: number;
  nome: string;
  resultado: unknown;
  thinkingTokens: number;
  duracao: number;
}

export interface AnalysisConfig {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  enableThinking: boolean;
  thinkingBudget: number;
}
