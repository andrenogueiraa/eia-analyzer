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
  areascriticas: string[];
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

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface AnalisePorFase {
  fase: number;
  nome: string;
  resultado: any;
  thinkingTokens: number;
  duracao: number;
}
