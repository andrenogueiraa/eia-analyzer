#!/usr/bin/env bun

import { readdirSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { config, validateConfig } from "./config";
import { extractPDF } from "./extractor";
import { AnalisadorEIA } from "./agents";
import type { RelatorioFinal } from "./types";

// ============ FUNÇÕES AUXILIARES ============

// Default directories for CLI usage
const INPUT_DIR = "./data/input";
const OUTPUT_DIR = "./data/output";

function listarPDFsNoInput(): string[] {
  if (!existsSync(INPUT_DIR)) {
    console.error(`Diretorio de input nao existe: ${INPUT_DIR}`);
    console.log(`\nCrie o diretorio e coloque os PDFs de EIA la:`);
    console.log(`  mkdir -p ${INPUT_DIR}`);
    process.exit(1);
  }

  const arquivos = readdirSync(INPUT_DIR);
  const pdfs = arquivos.filter((f) => f.toLowerCase().endsWith(".pdf"));

  if (pdfs.length === 0) {
    console.error(`Nenhum PDF encontrado em ${INPUT_DIR}`);
    console.log(`\nColoque os arquivos PDF de EIA no diretorio de input.`);
    process.exit(1);
  }

  return pdfs.map((pdf) => join(INPUT_DIR, pdf));
}

function salvarRelatorio(relatorio: RelatorioFinal, caminhoOriginal: string): void {
  const outputDir = OUTPUT_DIR;

  // Criar diretório de output se não existir
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const nomeBase = relatorio.documentoAnalisado.replace(".pdf", "");

  // Salvar JSON completo
  const caminhoJSON = join(outputDir, `${nomeBase}_analise_${timestamp}.json`);
  writeFileSync(caminhoJSON, JSON.stringify(relatorio, null, 2), "utf-8");

  // Salvar relatório em Markdown (mais legível)
  const caminhoMD = join(outputDir, `${nomeBase}_relatorio_${timestamp}.md`);
  const markdown = gerarMarkdown(relatorio);
  writeFileSync(caminhoMD, markdown, "utf-8");

  console.log(`\n${"=".repeat(80)}`);
  console.log(`✅ ANÁLISE CONCLUÍDA COM SUCESSO`);
  console.log(`${"=".repeat(80)}`);
  console.log(`\n📁 Relatórios salvos:`);
  console.log(`   JSON: ${caminhoJSON}`);
  console.log(`   MD:   ${caminhoMD}`);
  console.log(`\n⏱️  Tempo total: ${(relatorio.metadados.tempoTotal / 1000).toFixed(1)}s`);
  console.log(`🤖 Modelo usado: ${relatorio.metadados.modeloUsado}`);
  if (relatorio.metadados.thinkingTokensUsados > 0) {
    console.log(`💭 Thinking tokens: ${relatorio.metadados.thinkingTokensUsados.toLocaleString()}`);
  }
}

function gerarMarkdown(relatorio: RelatorioFinal): string {
  const md = `# Relatório de Análise de EIA

## Informações Gerais

- **Documento**: ${relatorio.documentoAnalisado}
- **Data da Análise**: ${relatorio.dataAnalise.toLocaleString("pt-BR")}
- **Modelo IA**: ${relatorio.metadados.modeloUsado}
- **Tempo de Análise**: ${(relatorio.metadados.tempoTotal / 1000).toFixed(1)}s
${relatorio.metadados.thinkingTokensUsados > 0 ? `- **Thinking Tokens**: ${relatorio.metadados.thinkingTokensUsados.toLocaleString()}` : ""}

---

## Síntese da Estrutura do Documento

${relatorio.contexto.estrutura}

### Áreas Críticas Identificadas

${relatorio.contexto.areasCriticas.map((area) => `- ${area}`).join("\n")}

---

## Análises Especializadas

${relatorio.analisesEspecializadas
  .map(
    (analise) => `
### ${analise.dominio}

**Analista**: ${analise.analista}
**Data**: ${analise.timestamp.toLocaleString("pt-BR")}

${analise.conteudo}

${analise.problemasCriticos.length > 0 ? `\n#### Problemas Críticos\n${analise.problemasCriticos.map((p) => `- ${p}`).join("\n")}` : ""}
${analise.alertas.length > 0 ? `\n#### Alertas\n${analise.alertas.map((a) => `- ${a}`).join("\n")}` : ""}
`
  )
  .join("\n---\n")}

---

## Verificação Cruzada

### Inconsistências Identificadas

${relatorio.verificacao.inconsistencias.length > 0 ? relatorio.verificacao.inconsistencias.map((i) => `- ${i}`).join("\n") : "_Nenhuma inconsistência encontrada._"}

### Validações

${relatorio.verificacao.validacoes.length > 0 ? relatorio.verificacao.validacoes.map((v) => `- ${v}`).join("\n") : "_Nenhuma validação específica._"}

### Lacunas Detectadas

${relatorio.verificacao.lacunas.length > 0 ? relatorio.verificacao.lacunas.map((l) => `- ${l}`).join("\n") : "_Nenhuma lacuna detectada._"}

---

## Conclusões Finais

${relatorio.conclusoes}

---

## Resumo de Problemas Críticos

${relatorio.problemasCriticos.length > 0 ? relatorio.problemasCriticos.map((p) => `- ${p}`).join("\n") : "_Nenhum problema crítico identificado._"}

---

## Recomendações

${relatorio.recomendacoes.length > 0 ? relatorio.recomendacoes.map((r) => `${r}`).join("\n") : "_Nenhuma recomendação específica._"}

---

_Relatório gerado automaticamente por IA. Deve ser revisado por analista humano qualificado._
`;

  return md;
}

// ============ MAIN ============

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║                   🌿  ANALISADOR DE EIA COM IA  🌿                        ║
║                                                                           ║
║              Análise Profunda de Estudos de Impacto Ambiental            ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);

  // Validar configuração
  try {
    validateConfig();
  } catch (error) {
    console.error(`\n❌ Erro de configuração: ${error}`);
    console.log(`\nCrie um arquivo .env com as configurações necessárias.`);
    console.log(`Use .env.example como referência.`);
    process.exit(1);
  }

  // Listar PDFs disponíveis
  const pdfs = listarPDFsNoInput();

  console.log(`\n📂 PDFs encontrados no diretório de input:`);
  pdfs.forEach((pdf, i) => {
    console.log(`   ${i + 1}. ${pdf.split("/").pop()}`);
  });

  // Por enquanto, analisar o primeiro PDF
  // TODO: Permitir seleção ou analisar todos
  const pdfParaAnalisar = pdfs[0];

  console.log(`\n🎯 Analisando: ${pdfParaAnalisar.split("/").pop()}`);

  try {
    // 1. Extrair PDF
    const documento = await extractPDF(pdfParaAnalisar);

    // 2. Analisar
    const analisador = new AnalisadorEIA();
    const relatorio = await analisador.analisar(documento);

    // 3. Salvar relatório
    salvarRelatorio(relatorio, pdfParaAnalisar);
  } catch (error) {
    console.error(`\n❌ Erro durante análise: ${error}`);
    process.exit(1);
  }
}

// Executar
main();
