import type {
  EIADocument,
  ContextoCompleto,
  AnaliseEspecializada,
  VerificacaoCruzada,
  RelatorioFinal,
  AnalisePorFase,
} from "./types";
import { config } from "./config";
import { createAIProvider, type AIProvider } from "./ai-provider";
import type { AnalysisConfig } from "./types";
import { toolsLegal, toolsTecnico, toolsImpactos, toolsMitigacao } from "./tools";
import { truncateText, estimateTokens } from "./extractor";

export class AnalisadorEIA {
  private aiProvider: AIProvider;
  private fases: AnalisePorFase[] = [];
  private analysisConfig?: AnalysisConfig;

  constructor(provider?: AIProvider, analysisConfig?: AnalysisConfig) {
    this.aiProvider = provider || createAIProvider();
    this.analysisConfig = analysisConfig;
  }

  // Helper to get thinking budget - uses dynamic config or fallback to static
  private getThinkingBudget(fase: keyof typeof config.thinkingBudgets): number | undefined {
    if (!this.aiProvider.supportsThinking) return undefined;
    if (this.analysisConfig?.enableThinking) {
      return this.analysisConfig.thinkingBudget;
    }
    return config.thinkingBudgets[fase];
  }

  // Helper to get max tokens - uses dynamic config or fallback to static
  private getMaxTokens(): number {
    return this.analysisConfig?.maxTokens || config.maxTokensResposta;
  }

  // Get model info for metadata
  private getModelInfo(): string {
    if (this.analysisConfig) {
      return `${this.analysisConfig.provider} - ${this.analysisConfig.model}`;
    }
    return `${config.provider} - ${config.models[config.provider as keyof typeof config.models]}`;
  }

  async analisar(documento: EIADocument): Promise<RelatorioFinal> {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`🤖 INICIANDO ANÁLISE PROFUNDA DE EIA`);
    console.log(`${"=".repeat(80)}`);

    const inicioTotal = Date.now();

    // FASE 1: Leitura Profunda e Contextualização
    const contexto = await this.fase1_leituraProfunda(documento);

    // FASE 2: Análises Especializadas por Domínio
    const analises = await this.fase2_analiseEspecializada(documento, contexto);

    // FASE 3: Verificação Cruzada
    const verificacao = await this.fase3_verificacaoCruzada(documento, contexto, analises);

    // FASE 4: Consolidação Final
    const relatorioFinal = await this.fase4_consolidacaoFinal(
      documento,
      contexto,
      analises,
      verificacao,
      Date.now() - inicioTotal
    );

    return relatorioFinal;
  }

  // ============ FASE 1: LEITURA PROFUNDA ============
  private async fase1_leituraProfunda(documento: EIADocument): Promise<ContextoCompleto> {
    console.log(`\n${"─".repeat(80)}`);
    console.log(`📖 FASE 1: LEITURA PROFUNDA E CONTEXTUALIZAÇÃO`);
    console.log(`${"─".repeat(80)}`);

    const inicio = Date.now();

    // Truncar se muito grande (limite de ~150k tokens)
    const textoParaAnalise = truncateText(documento.rawText, 600000);
    const tokensEstimados = estimateTokens(textoParaAnalise);

    console.log(`\n📊 Estimativa de tokens: ${tokensEstimados.toLocaleString()}`);

    if (tokensEstimados > 150000) {
      console.log(`⚠️  AVISO: Documento muito grande. Análise pode ser parcial.`);
    }

    const prompt = `Você é um especialista em análise de Estudos de Impacto Ambiental (EIA).

DOCUMENTO COMPLETO A ANALISAR:
${textoParaAnalise}

TAREFA: Faça uma leitura PROFUNDA e CUIDADOSA deste EIA completo. Esta é a primeira fase de uma análise em múltiplas passadas.

Você deve:

1. **Mapear a estrutura completa do documento**
   - Identificar todas as seções e subseções
   - Verificar se a estrutura segue padrões regulatórios (CONAMA 001/86)
   - Listar seções presentes e ausentes

2. **Identificar relações entre seções**
   - Como diferentes partes se conectam?
   - Quais seções fazem referência cruzada?
   - Há consistência entre diagnóstico → impactos → mitigação?

3. **Listar áreas críticas para análise detalhada**
   - Quais seções precisam de atenção especial?
   - Onde há possíveis problemas ou lacunas?
   - Quais aspectos são mais relevantes para o projeto?

4. **Criar um "mapa mental" do documento**
   - Resumo executivo da essência do EIA
   - Tipo de empreendimento e localização
   - Principais impactos identificados pelo estudo
   - Qualidade geral aparente

NÃO faça análise crítica ainda. Apenas ENTENDA profundamente o documento.

Responda em formato estruturado JSON:
{
  "estrutura": "descrição detalhada da estrutura",
  "mapaRelacoes": "como as seções se relacionam",
  "areasCriticas": ["área 1", "área 2", ...],
  "observacoes": "observações gerais importantes"
}`;

    const response = await this.aiProvider.generateResponse({
      messages: [{ role: "user", content: prompt }],
      thinkingBudget: this.getThinkingBudget("fase1"),
      maxTokens: this.getMaxTokens(),
    });

    const duracao = Date.now() - inicio;

    console.log(`\n✓ Fase 1 concluída em ${(duracao / 1000).toFixed(1)}s`);
    if (response.thinkingContent) {
      console.log(`  💭 Thinking gerado: ${response.thinkingContent.substring(0, 200)}...`);
    }
    console.log(`  📝 Tokens usados: ${response.usage?.inputTokens} in / ${response.usage?.outputTokens} out`);

    // Parsear resposta
    let contexto: ContextoCompleto;
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      contexto = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        estrutura: response.content,
        mapaRelacoes: "",
        areasCriticas: [],
        observacoes: "",
      };
    } catch {
      contexto = {
        estrutura: response.content,
        mapaRelacoes: "",
        areasCriticas: [],
        observacoes: "",
      };
    }

    this.fases.push({
      fase: 1,
      nome: "Leitura Profunda",
      resultado: contexto,
      thinkingTokens: response.usage?.thinkingTokens || 0,
      duracao,
    });

    return contexto;
  }

  // ============ FASE 2: ANÁLISES ESPECIALIZADAS ============
  private async fase2_analiseEspecializada(
    documento: EIADocument,
    contexto: ContextoCompleto
  ): Promise<AnaliseEspecializada[]> {
    console.log(`\n${"─".repeat(80)}`);
    console.log(`🔬 FASE 2: ANÁLISES ESPECIALIZADAS POR DOMÍNIO`);
    console.log(`${"─".repeat(80)}`);

    const textoParaAnalise = truncateText(documento.rawText, 600000);

    // Executar análises em paralelo
    const promessas = [
      this.analiseLegal(textoParaAnalise, contexto),
      this.analiseTecnica(textoParaAnalise, contexto),
      this.analiseImpactos(textoParaAnalise, contexto),
      this.analiseMitigacao(textoParaAnalise, contexto),
    ];

    const analises = await Promise.all(promessas);

    console.log(`\n✓ Todas as análises especializadas concluídas`);

    return analises;
  }

  private async analiseLegal(textoEIA: string, contexto: ContextoCompleto): Promise<AnaliseEspecializada> {
    console.log(`\n  ⚖️  Análise Legal...`);
    const inicio = Date.now();

    const prompt = `Você é especialista em DIREITO AMBIENTAL BRASILEIRO.

CONTEXTO DO DOCUMENTO (da leitura profunda):
${JSON.stringify(contexto, null, 2)}

EIA COMPLETO:
${textoEIA}

TAREFA: Analise METICULOSAMENTE a conformidade legal deste EIA.

Verifique:
1. Estrutura conforme Resolução CONAMA 001/86 e 237/97
2. Todos os requisitos legais obrigatórios presentes
3. Qualidade das informações fornecidas
4. Referências legais corretas e atualizadas
5. Processos administrativos seguidos corretamente

Use as ferramentas disponíveis para:
- Buscar legislação específica
- Verificar conformidade com requisitos
- Consultar precedentes

Identifique:
- ✅ Pontos conformes
- ⚠️  Alertas e inconsistências
- ❌ Não-conformidades graves

Seja EXTREMAMENTE rigoroso. Esta análise é crítica.`;

    const response = await this.aiProvider.generateResponse({
      messages: [{ role: "user", content: prompt }],
      thinkingBudget: this.getThinkingBudget("fase2"),
      tools: this.aiProvider.supportsTools ? toolsLegal : undefined,
      maxTokens: this.getMaxTokens(),
    });

    const analise: AnaliseEspecializada = {
      dominio: "Legal",
      analista: "Agente Jurídico Ambiental",
      conteudo: response.content,
      problemasCriticos: this.extrairProblemas(response.content, "❌"),
      alertas: this.extrairProblemas(response.content, "⚠️"),
      timestamp: new Date(),
    };

    console.log(`     ✓ Concluída em ${((Date.now() - inicio) / 1000).toFixed(1)}s`);
    return analise;
  }

  private async analiseTecnica(textoEIA: string, contexto: ContextoCompleto): Promise<AnaliseEspecializada> {
    console.log(`\n  🔧 Análise Técnica...`);
    const inicio = Date.now();

    const prompt = `Você é especialista técnico em ESTUDOS AMBIENTAIS (biólogo, engenheiro ambiental).

CONTEXTO: ${JSON.stringify(contexto, null, 2)}

EIA: ${textoEIA}

TAREFA: Avalie rigorosamente a QUALIDADE TÉCNICA deste EIA.

Verifique:
1. Metodologias científicas utilizadas (são adequadas?)
2. Amostragem e coleta de dados (suficientes?)
3. Análises estatísticas e cálculos (corretos?)
4. Qualidade dos mapas e representações cartográficas
5. Consistência dos dados apresentados
6. Referências bibliográficas (atualizadas e relevantes?)

Seja crítico quanto a:
- Dados insuficientes ou mal coletados
- Metodologias inadequadas ou desatualizadas
- Conclusões não fundamentadas em dados
- Análises superficiais`;

    const response = await this.aiProvider.generateResponse({
      messages: [{ role: "user", content: prompt }],
      thinkingBudget: this.getThinkingBudget("fase2"),
      tools: this.aiProvider.supportsTools ? toolsTecnico : undefined,
      maxTokens: this.getMaxTokens(),
    });

    const analise: AnaliseEspecializada = {
      dominio: "Técnico",
      analista: "Agente Técnico Científico",
      conteudo: response.content,
      problemasCriticos: this.extrairProblemas(response.content, "❌"),
      alertas: this.extrairProblemas(response.content, "⚠️"),
      timestamp: new Date(),
    };

    console.log(`     ✓ Concluída em ${((Date.now() - inicio) / 1000).toFixed(1)}s`);
    return analise;
  }

  private async analiseImpactos(textoEIA: string, contexto: ContextoCompleto): Promise<AnaliseEspecializada> {
    console.log(`\n  💥 Análise de Impactos...`);
    const inicio = Date.now();

    const prompt = `Você é especialista em IDENTIFICAÇÃO E AVALIAÇÃO DE IMPACTOS AMBIENTAIS.

CONTEXTO: ${JSON.stringify(contexto, null, 2)}

EIA: ${textoEIA}

TAREFA: Analise a IDENTIFICAÇÃO e AVALIAÇÃO DE IMPACTOS.

Verifique:
1. Todos os impactos relevantes foram identificados?
2. Impactos diretos, indiretos e cumulativos
3. Avaliação de magnitude, importância e significância
4. Impactos em diferentes fases (implantação, operação, desativação)
5. Áreas de influência bem definidas
6. Impactos socioeconômicos adequadamente avaliados

Questione:
- Há impactos subestimados ou ignorados?
- A metodologia de avaliação é adequada?
- Impactos sinérgicos foram considerados?
- População afetada foi adequadamente considerada?`;

    const response = await this.aiProvider.generateResponse({
      messages: [{ role: "user", content: prompt }],
      thinkingBudget: this.getThinkingBudget("fase2"),
      tools: this.aiProvider.supportsTools ? toolsImpactos : undefined,
      maxTokens: this.getMaxTokens(),
    });

    const analise: AnaliseEspecializada = {
      dominio: "Impactos Ambientais",
      analista: "Agente Avaliador de Impactos",
      conteudo: response.content,
      problemasCriticos: this.extrairProblemas(response.content, "❌"),
      alertas: this.extrairProblemas(response.content, "⚠️"),
      timestamp: new Date(),
    };

    console.log(`     ✓ Concluída em ${((Date.now() - inicio) / 1000).toFixed(1)}s`);
    return analise;
  }

  private async analiseMitigacao(textoEIA: string, contexto: ContextoCompleto): Promise<AnaliseEspecializada> {
    console.log(`\n  🛡️  Análise de Mitigação...`);
    const inicio = Date.now();

    const prompt = `Você é especialista em MEDIDAS MITIGADORAS E PROGRAMAS AMBIENTAIS.

CONTEXTO: ${JSON.stringify(contexto, null, 2)}

EIA: ${textoEIA}

TAREFA: Avalie as MEDIDAS MITIGADORAS e PROGRAMAS AMBIENTAIS propostos.

Verifique:
1. Cada impacto identificado tem medida correspondente?
2. Medidas são tecnicamente viáveis e eficazes?
3. Programas ambientais bem estruturados?
4. Indicadores de monitoramento adequados?
5. Cronograma de implementação realista?
6. Responsabilidades claras?

Questione:
- Medidas genéricas ou específicas?
- Custo-benefício das medidas
- Viabilidade de implementação
- Eficácia esperada vs. impacto`;

    const response = await this.aiProvider.generateResponse({
      messages: [{ role: "user", content: prompt }],
      thinkingBudget: this.getThinkingBudget("fase2"),
      tools: this.aiProvider.supportsTools ? toolsMitigacao : undefined,
      maxTokens: this.getMaxTokens(),
    });

    const analise: AnaliseEspecializada = {
      dominio: "Mitigação e Programas",
      analista: "Agente de Medidas Mitigadoras",
      conteudo: response.content,
      problemasCriticos: this.extrairProblemas(response.content, "❌"),
      alertas: this.extrairProblemas(response.content, "⚠️"),
      timestamp: new Date(),
    };

    console.log(`     ✓ Concluída em ${((Date.now() - inicio) / 1000).toFixed(1)}s`);
    return analise;
  }

  // ============ FASE 3: VERIFICAÇÃO CRUZADA ============
  private async fase3_verificacaoCruzada(
    documento: EIADocument,
    contexto: ContextoCompleto,
    analises: AnaliseEspecializada[]
  ): Promise<VerificacaoCruzada> {
    console.log(`\n${"─".repeat(80)}`);
    console.log(`🔍 FASE 3: VERIFICAÇÃO CRUZADA E VALIDAÇÃO`);
    console.log(`${"─".repeat(80)}`);

    const inicio = Date.now();

    const resumoAnalises = analises
      .map(
        (a) => `
## ${a.dominio}
${a.conteudo.substring(0, 2000)}...
`
      )
      .join("\n");

    const prompt = `Você é REVISOR SÊNIOR de estudos ambientais com visão crítica e sistêmica.

CONTEXTO COMPLETO: ${JSON.stringify(contexto, null, 2)}

ANÁLISES JÁ REALIZADAS:
${resumoAnalises}

TAREFA CRÍTICA: Fazer VERIFICAÇÃO CRUZADA de todas as análises.

Procure por:

1. **Inconsistências entre análises**
   - Um domínio identificou problema que outro ignorou?
   - Conclusões contraditórias?
   - Dados conflitantes?

2. **Validação das conclusões**
   - As críticas estão bem fundamentadas?
   - Há exageros ou subestimações?
   - Faltou alguma perspectiva?

3. **Lacunas não identificadas**
   - Há aspectos importantes que NENHUM agente analisou?
   - Problemas sistêmicos que só aparecem na visão geral?

4. **Pontos que precisam reanálise**
   - Quais conclusões precisam ser revisadas?
   - Onde falta aprofundamento?

Responda em formato JSON:
{
  "inconsistencias": ["inconsistência 1", ...],
  "validacoes": ["validação 1", ...],
  "lacunas": ["lacuna 1", ...],
  "pontosReanalisar": ["ponto 1", ...]
}`;

    const response = await this.aiProvider.generateResponse({
      messages: [{ role: "user", content: prompt }],
      thinkingBudget: this.getThinkingBudget("fase3"),
      maxTokens: this.getMaxTokens(),
    });

    const duracao = Date.now() - inicio;

    console.log(`\n✓ Fase 3 concluída em ${(duracao / 1000).toFixed(1)}s`);

    // Parsear resposta
    let verificacao: VerificacaoCruzada;
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      verificacao = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        inconsistencias: [],
        validacoes: [],
        lacunas: [],
        pontosReanalisar: [],
      };
    } catch {
      verificacao = {
        inconsistencias: [],
        validacoes: [],
        lacunas: [],
        pontosReanalisar: [],
      };
    }

    this.fases.push({
      fase: 3,
      nome: "Verificação Cruzada",
      resultado: verificacao,
      thinkingTokens: response.usage?.thinkingTokens || 0,
      duracao,
    });

    return verificacao;
  }

  // ============ FASE 4: CONSOLIDAÇÃO FINAL ============
  private async fase4_consolidacaoFinal(
    documento: EIADocument,
    contexto: ContextoCompleto,
    analises: AnaliseEspecializada[],
    verificacao: VerificacaoCruzada,
    tempoTotal: number
  ): Promise<RelatorioFinal> {
    console.log(`\n${"─".repeat(80)}`);
    console.log(`📊 FASE 4: CONSOLIDAÇÃO E RELATÓRIO FINAL`);
    console.log(`${"─".repeat(80)}`);

    const inicio = Date.now();

    const resumoCompleto = `
CONTEXTO: ${JSON.stringify(contexto, null, 2)}

ANÁLISES ESPECIALIZADAS:
${analises.map((a) => `\n### ${a.dominio}\n${a.conteudo}`).join("\n")}

VERIFICAÇÃO CRUZADA: ${JSON.stringify(verificacao, null, 2)}
`;

    const prompt = `Você é o COORDENADOR FINAL da análise deste EIA.

Você tem acesso a TODAS as análises anteriores:
${resumoCompleto}

TAREFA FINAL: Gerar RELATÓRIO CONSOLIDADO DETALHADO para o analista humano.

O relatório deve:

1. **Síntese Executiva**
   - Resumo geral do EIA e qualidade
   - Principal conclusão da análise

2. **Problemas Críticos** (PRIORIZADOS por gravidade)
   - Liste APENAS problemas graves que podem inviabilizar licenciamento
   - Fundamente CADA um com base legal/técnica
   - Cite trechos específicos do EIA

3. **Alertas e Recomendações**
   - Problemas menores que precisam correção
   - Sugestões de melhoria
   - Documentação adicional necessária

4. **Aspectos Positivos**
   - Pontos fortes do estudo
   - Conformidades importantes

5. **Parecer Final**
   - Recomendação: Aprovação / Aprovação condicionada / Complementação / Rejeição
   - Justificativa fundamentada

IMPORTANTE:
- Seja OBJETIVO e DIRETO
- Use linguagem técnica mas clara
- CITE referências legais e trechos do EIA
- PRIORIZE por importância
- Este relatório será usado por analista humano em decisão real`;

    const response = await this.aiProvider.generateResponse({
      messages: [{ role: "user", content: prompt }],
      thinkingBudget: this.getThinkingBudget("fase4"),
      maxTokens: this.getMaxTokens(),
    });

    const duracao = Date.now() - inicio;

    console.log(`\n✓ Fase 4 concluída em ${(duracao / 1000).toFixed(1)}s`);

    // Extrair problemas críticos de todas as análises
    const todosProblemasCriticos = analises.flatMap((a) => a.problemasCriticos);

    // Extrair recomendações do relatório final
    const recomendacoes = this.extrairRecomendacoes(response.content);

    const relatorio: RelatorioFinal = {
      documentoAnalisado: documento.fileName,
      dataAnalise: new Date(),
      contexto,
      analisesEspecializadas: analises,
      verificacao,
      conclusoes: response.content,
      problemasCriticos: todosProblemasCriticos,
      recomendacoes,
      metadados: {
        modeloUsado: this.getModelInfo(),
        thinkingTokensUsados: this.fases.reduce((acc, f) => acc + f.thinkingTokens, 0),
        tempoTotal,
      },
    };

    this.fases.push({
      fase: 4,
      nome: "Consolidação Final",
      resultado: relatorio,
      thinkingTokens: response.usage?.thinkingTokens || 0,
      duracao,
    });

    return relatorio;
  }

  // ============ UTILITÁRIOS ============
  private extrairProblemas(texto: string, marcador: string): string[] {
    const problemas: string[] = [];
    const linhas = texto.split("\n");

    for (const linha of linhas) {
      if (linha.includes(marcador)) {
        problemas.push(linha.trim());
      }
    }

    return problemas;
  }

  private extrairRecomendacoes(texto: string): string[] {
    const recomendacoes: string[] = [];
    const linhas = texto.split("\n");

    let dentroSecaoRecomendacoes = false;
    for (const linha of linhas) {
      if (linha.toLowerCase().includes("recomenda")) {
        dentroSecaoRecomendacoes = true;
      }

      if (dentroSecaoRecomendacoes && (linha.trim().startsWith("-") || linha.trim().startsWith("•"))) {
        recomendacoes.push(linha.trim());
      }
    }

    return recomendacoes;
  }
}
