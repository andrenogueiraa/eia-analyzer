#!/usr/bin/env bun

import { extractPDF } from "./src/extractor";
import { AnalisadorEIA } from "./src/agents";
import { validateConfig } from "./src/config";

console.log("Starting test analysis...");

try {
  console.log("1. Validating config...");
  validateConfig();

  console.log("2. Extracting PDF...");
  const documento = await extractPDF("data/input/eia.pdf");
  console.log(`   Extracted ${documento.totalPages} pages`);

  console.log("3. Creating analyzer...");
  const analisador = new AnalisadorEIA();

  console.log("4. Starting analysis...");
  const relatorio = await analisador.analisar(documento);

  console.log("5. Analysis complete!");
  console.log(JSON.stringify(relatorio, null, 2));

} catch (error) {
  console.error("ERROR:", error);
  process.exit(1);
}
