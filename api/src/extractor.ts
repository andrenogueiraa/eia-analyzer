import pdf from "pdf-parse";
import { readFileSync } from "fs";
import type { EIADocument } from "./types";

export async function extractPDF(filePath: string): Promise<EIADocument> {
  console.log(`\n📄 Extraindo PDF: ${filePath}`);

  try {
    const dataBuffer = readFileSync(filePath);
    const data = await pdf(dataBuffer);

    const document: EIADocument = {
      filePath,
      fileName: filePath.split("/").pop() || "unknown",
      rawText: data.text,
      totalPages: data.numpages,
      extractedAt: new Date(),
    };

    console.log(`✓ PDF extraído com sucesso`);
    console.log(`  Páginas: ${document.totalPages}`);
    console.log(`  Caracteres: ${document.rawText.length.toLocaleString()}`);
    console.log(`  Palavras: ${document.rawText.split(/\s+/).length.toLocaleString()}`);

    return document;
  } catch (error) {
    console.error(`✗ Erro ao extrair PDF: ${error}`);
    throw error;
  }
}

export function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars) + "\n\n[... texto truncado ...]";
}

export function estimateTokens(text: string): number {
  // Estimativa aproximada: ~4 caracteres por token
  return Math.ceil(text.length / 4);
}
