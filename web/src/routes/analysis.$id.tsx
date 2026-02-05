import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { AnalysisWithStudy } from "@/types/convex";
import type { Id } from "@/../convex/_generated/dataModel";
import { useState, useRef } from "react";
import Markdown from "react-markdown";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Initialize pdfmake fonts
pdfMake.vfs = pdfFonts.vfs;
import {
  ArrowLeft,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Settings2,
  Clock,
  DollarSign,
  Loader2,
  ChevronDown,
  ChevronRight,
  Scale,
  Wrench,
  Target,
  Shield,
  BookOpen,
  ListChecks,
  AlertCircle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatBytes, cn } from "@/lib/utils";
import { getProviderName } from "@/lib/constants";

// Types for the analysis result
interface AnaliseEspecializada {
  dominio: string;
  analista: string;
  conteudo: string;
  problemasCriticos: string[];
  alertas: string[];
  timestamp: string;
}

interface Contexto {
  estrutura: unknown;
  mapaRelacoes: unknown;
  areasCriticas: string[];
  observacoes: unknown;
}

interface Verificacao {
  inconsistencias: string[];
  validacoes: string[];
  lacunas: string[];
  pontosReanalisar: string[];
}

interface FullAnalysisResult {
  analisesEspecializadas: AnaliseEspecializada[];
  conclusoes: string;
  contexto: Contexto;
  verificacao: Verificacao;
  problemasCriticos: string[];
  recomendacoes: string[];
  metadados: {
    modeloUsado: string;
    tempoTotal: number;
    thinkingTokensUsados: number;
  };
  documentoAnalisado: string;
  dataAnalise: string;
}

export const Route = createFileRoute("/analysis/$id")({
  component: AnalysisDetailPage,
});

function AnalysisDetailPage() {
  const { id } = Route.useParams();
  const analysis = useQuery(api.analyses.get, { id: id as Id<"analyses"> }) as AnalysisWithStudy | null | undefined;
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  if (analysis === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
          <h3 className="mb-2 text-lg font-semibold">Analise nao encontrada</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            A analise solicitada nao existe ou foi removida
          </p>
          <Button asChild variant="outline">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleExportPDF = async () => {
    const result = analysis.result as FullAnalysisResult | undefined;
    if (!result) return;

    setIsExporting(true);

    try {
      const fileName = analysis.study?.fileName?.replace(".pdf", "") || "analise";

      // Helper to convert markdown to pdfmake content
      const markdownToContent = (text: string): unknown[] => {
        const content: unknown[] = [];
        const lines = text.split("\n");

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith("# ")) {
            content.push({ text: trimmed.slice(2), style: "h1", margin: [0, 10, 0, 5] });
          } else if (trimmed.startsWith("## ")) {
            content.push({ text: trimmed.slice(3), style: "h2", margin: [0, 10, 0, 5] });
          } else if (trimmed.startsWith("### ")) {
            content.push({ text: trimmed.slice(4), style: "h3", margin: [0, 8, 0, 4] });
          } else if (trimmed.startsWith("#### ")) {
            content.push({ text: trimmed.slice(5), style: "h4", margin: [0, 6, 0, 3] });
          } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            content.push({ text: `• ${trimmed.slice(2)}`, margin: [10, 2, 0, 2] });
          } else if (/^\d+\.\s/.test(trimmed)) {
            content.push({ text: trimmed, margin: [10, 2, 0, 2] });
          } else if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
            content.push({ text: trimmed.slice(2, -2), bold: true, margin: [0, 4, 0, 2] });
          } else if (trimmed === "---") {
            content.push({ canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5 }], margin: [0, 10, 0, 10] });
          } else {
            // Process inline bold
            const parts: unknown[] = [];
            const regex = /\*\*([^*]+)\*\*/g;
            let lastIndex = 0;
            let match;
            while ((match = regex.exec(trimmed)) !== null) {
              if (match.index > lastIndex) {
                parts.push(trimmed.slice(lastIndex, match.index));
              }
              parts.push({ text: match[1], bold: true });
              lastIndex = regex.lastIndex;
            }
            if (lastIndex < trimmed.length) {
              parts.push(trimmed.slice(lastIndex));
            }
            content.push({ text: parts.length > 1 ? parts : trimmed, margin: [0, 2, 0, 2] });
          }
        }
        return content;
      };

      // Build document content
      const docContent: unknown[] = [
        { text: "RELATÓRIO DE ANÁLISE - EIA", style: "title" },
        { text: `Arquivo: ${analysis.study?.fileName || "N/A"}`, margin: [0, 5, 0, 2] },
        { text: `Data: ${new Date(analysis.createdAt).toLocaleDateString("pt-BR")}`, margin: [0, 0, 0, 2] },
        { text: `Modelo: ${analysis.config.model}`, margin: [0, 0, 0, 10] },
        { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }], margin: [0, 0, 0, 15] },
      ];

      // Conclusions
      if (result.conclusoes) {
        docContent.push({ text: "RELATÓRIO FINAL", style: "h1", margin: [0, 10, 0, 10] });
        docContent.push(...markdownToContent(result.conclusoes));
      }

      // Specialized Analyses
      if (result.analisesEspecializadas?.length > 0) {
        docContent.push({ text: "ANÁLISES ESPECIALIZADAS", style: "h1", pageBreak: "before", margin: [0, 0, 0, 10] });
        for (const analise of result.analisesEspecializadas) {
          docContent.push({ text: analise.dominio.toUpperCase(), style: "h2", margin: [0, 15, 0, 5] });
          docContent.push({ text: analise.analista, italics: true, margin: [0, 0, 0, 10] });
          docContent.push(...markdownToContent(analise.conteudo));
        }
      }

      // Verification
      if (result.verificacao) {
        docContent.push({ text: "VERIFICAÇÃO CRUZADA", style: "h1", pageBreak: "before", margin: [0, 0, 0, 10] });

        if (result.verificacao.inconsistencias?.length > 0) {
          docContent.push({ text: "Inconsistências", style: "h3", margin: [0, 10, 0, 5] });
          result.verificacao.inconsistencias.forEach(item => {
            docContent.push({ text: `• ${item}`, margin: [10, 2, 0, 2] });
          });
        }

        if (result.verificacao.lacunas?.length > 0) {
          docContent.push({ text: "Lacunas", style: "h3", margin: [0, 10, 0, 5] });
          result.verificacao.lacunas.forEach(item => {
            docContent.push({ text: `• ${item}`, margin: [10, 2, 0, 2] });
          });
        }

        if (result.verificacao.validacoes?.length > 0) {
          docContent.push({ text: "Validações", style: "h3", margin: [0, 10, 0, 5] });
          result.verificacao.validacoes.forEach(item => {
            docContent.push({ text: `• ${item}`, margin: [10, 2, 0, 2] });
          });
        }
      }

      // Create PDF document definition
      const docDefinition = {
        content: docContent,
        styles: {
          title: { fontSize: 18, bold: true, alignment: "center" as const, margin: [0, 0, 0, 10] },
          h1: { fontSize: 16, bold: true },
          h2: { fontSize: 14, bold: true },
          h3: { fontSize: 12, bold: true },
          h4: { fontSize: 11, bold: true },
        },
        defaultStyle: {
          fontSize: 10,
          lineHeight: 1.3,
        },
        pageSize: "A4" as const,
        pageMargins: [40, 40, 40, 40] as [number, number, number, number],
      };

      // Generate and download PDF
      pdfMake.createPdf(docDefinition).download(`${fileName}-relatorio.pdf`);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      const message = error instanceof Error ? error.message : String(error);
      alert(`Erro ao exportar PDF: ${message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const getDuration = () => {
    if (!analysis.startedAt || !analysis.completedAt) return null;
    const duration = analysis.completedAt - analysis.startedAt;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              Detalhes da Analise
            </h1>
          </div>
          {analysis.study && (
            <p className="text-muted-foreground">
              <Link
                to="/study/$id"
                params={{ id: analysis.study._id }}
                className="hover:underline"
              >
                {analysis.study.fileName}
              </Link>
            </p>
          )}
        </div>
        {analysis.status === "completed" && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Exportar PDF
          </Button>
        )}
      </div>

      {/* Config Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Configuracao da Analise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-6">
            <ConfigItem label="Provedor" value={getProviderName(analysis.config.provider)} />
            <ConfigItem label="Modelo" value={analysis.config.model} />
            <ConfigItem label="Temperatura" value={analysis.config.temperature.toString()} />
            <ConfigItem label="Max Tokens" value={analysis.config.maxTokens.toLocaleString()} />
            <ConfigItem
              label="Reasoning"
              value={
                analysis.config.enableThinking ? (
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    Ativo ({analysis.config.thinkingBudget.toLocaleString()})
                  </Badge>
                ) : (
                  "Desativado"
                )
              }
            />
            <ConfigItem
              label="Status"
              value={<StatusBadge status={analysis.status} />}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats Card */}
      {analysis.study && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informacoes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <InfoItem label="Arquivo" value={analysis.study.fileName} />
              <InfoItem label="Tamanho" value={formatBytes(analysis.study.fileSize)} />
              <InfoItem
                label="Data"
                value={new Date(analysis.createdAt).toLocaleDateString("pt-BR")}
              />
              {getDuration() && (
                <InfoItem
                  label="Duracao"
                  value={
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {getDuration()}
                    </span>
                  }
                />
              )}
              {analysis.cost && (
                <InfoItem
                  label="Custo"
                  value={
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      ${analysis.cost.toFixed(2)}
                    </span>
                  }
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing State */}
      {analysis.status === "processing" && analysis.progress && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Sparkles className="h-5 w-5" />
              Analise em Andamento
            </CardTitle>
            <CardDescription>
              {analysis.progress.phaseName} - Fase {analysis.progress.phase} de 4
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={analysis.progress.percentage} className="mb-2" />
            <p className="text-sm text-muted-foreground">
              {analysis.progress.percentage}% concluido
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {analysis.status === "failed" && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <XCircle className="h-5 w-5" />
              Erro na Analise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-800">{analysis.error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {analysis.status === "completed" && analysis.result && (
        <div ref={reportRef}>
          <AnalysisResults result={analysis.result} />
        </div>
      )}

      {/* Pending State */}
      {analysis.status === "pending" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="mb-4 h-16 w-16 text-yellow-500" />
            <h3 className="mb-2 text-lg font-semibold">Aguardando Analise</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Esta analise ainda nao foi iniciada
            </p>
            <Button asChild>
              <Link to="/">Voltar ao Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AnalysisResults({ result }: { result: FullAnalysisResult }) {
  const getDomainIcon = (domain: string) => {
    switch (domain.toLowerCase()) {
      case "legal":
        return <Scale className="h-5 w-5" />;
      case "técnico":
        return <Wrench className="h-5 w-5" />;
      case "impactos ambientais":
        return <Target className="h-5 w-5" />;
      case "mitigação e programas":
        return <Shield className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Metadata Card */}
      {result.metadados && (
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Metadados da Analise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Modelo</p>
                <p className="font-medium">{result.metadados.modeloUsado}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tempo Total</p>
                <p className="font-medium">
                  {Math.floor(result.metadados.tempoTotal / 60000)}m{" "}
                  {Math.floor((result.metadados.tempoTotal % 60000) / 1000)}s
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data</p>
                <p className="font-medium">
                  {new Date(result.dataAnalise).toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conclusions - Main Report */}
      {result.conclusoes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Relatorio Final
            </CardTitle>
            <CardDescription>
              Parecer consolidado da analise do EIA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground">
              <Markdown>{result.conclusoes}</Markdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Specialized Analyses */}
      {result.analisesEspecializadas && result.analisesEspecializadas.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Analises Especializadas</h2>
          {result.analisesEspecializadas.map((analise, index) => (
            <CollapsibleCard
              key={index}
              icon={getDomainIcon(analise.dominio)}
              title={analise.dominio}
              subtitle={analise.analista}
              defaultOpen={index === 0}
            >
              <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground">
                <Markdown>{analise.conteudo}</Markdown>
              </div>
              {analise.problemasCriticos.length > 0 && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:bg-red-950/20">
                  <h4 className="mb-2 font-semibold text-red-800 dark:text-red-400">
                    Problemas Criticos
                  </h4>
                  <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
                    {analise.problemasCriticos.map((p, i) => (
                      <li key={i}>• {p}</li>
                    ))}
                  </ul>
                </div>
              )}
              {analise.alertas.length > 0 && (
                <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:bg-yellow-950/20">
                  <h4 className="mb-2 font-semibold text-yellow-800 dark:text-yellow-400">
                    Alertas
                  </h4>
                  <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                    {analise.alertas.map((a, i) => (
                      <li key={i}>• {a}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CollapsibleCard>
          ))}
        </div>
      )}

      {/* Context */}
      {result.contexto && (
        <CollapsibleCard
          icon={<FileText className="h-5 w-5" />}
          title="Contexto do Documento"
          subtitle="Estrutura e areas criticas identificadas"
          defaultOpen={false}
        >
          {result.contexto.areasCriticas && result.contexto.areasCriticas.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-2 font-semibold">Areas Criticas</h4>
              <ul className="space-y-2">
                {result.contexto.areasCriticas.map((area, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.contexto.estrutura && (
            <div className="mt-4">
              <h4 className="mb-2 font-semibold">Estrutura</h4>
              <pre className="overflow-auto rounded-lg bg-muted p-4 text-xs">
                {JSON.stringify(result.contexto.estrutura, null, 2)}
              </pre>
            </div>
          )}
        </CollapsibleCard>
      )}

      {/* Verification */}
      {result.verificacao && (
        <CollapsibleCard
          icon={<ListChecks className="h-5 w-5" />}
          title="Verificacao Cruzada"
          subtitle="Validacao e identificacao de lacunas"
          defaultOpen={false}
        >
          {result.verificacao.inconsistencias && result.verificacao.inconsistencias.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-2 font-semibold text-red-700 dark:text-red-400">
                Inconsistencias Identificadas
              </h4>
              <ul className="space-y-2">
                {result.verificacao.inconsistencias.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.verificacao.lacunas && result.verificacao.lacunas.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-2 font-semibold text-orange-700 dark:text-orange-400">
                Lacunas Identificadas
              </h4>
              <ul className="space-y-2">
                {result.verificacao.lacunas.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.verificacao.validacoes && result.verificacao.validacoes.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-2 font-semibold text-green-700 dark:text-green-400">
                Validacoes Confirmadas
              </h4>
              <ul className="space-y-2">
                {result.verificacao.validacoes.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.verificacao.pontosReanalisar && result.verificacao.pontosReanalisar.length > 0 && (
            <div>
              <h4 className="mb-2 font-semibold text-blue-700 dark:text-blue-400">
                Pontos para Reanalisar
              </h4>
              <ul className="space-y-2">
                {result.verificacao.pontosReanalisar.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CollapsibleCard>
      )}

      {/* Recommendations */}
      {result.recomendacoes && result.recomendacoes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Recomendacoes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.recomendacoes
                .filter((rec) => rec && rec.trim() !== "---")
                .map((rec, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Critical Problems */}
      {result.problemasCriticos && result.problemasCriticos.length > 0 && (
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              Problemas Criticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.problemasCriticos.map((problema, index) => (
                <li key={index} className="flex gap-2 text-red-700 dark:text-red-300">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{problema}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CollapsibleCard({
  icon,
  title,
  subtitle,
  defaultOpen = false,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {icon}
                <div>
                  <CardTitle className="text-lg">{title}</CardTitle>
                  {subtitle && <CardDescription>{subtitle}</CardDescription>}
                </div>
              </div>
              {isOpen ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}


function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function ConfigItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: { label: "Pendente", variant: "secondary" as const },
    processing: { label: "Processando", variant: "default" as const },
    completed: { label: "Concluido", variant: "default" as const },
    failed: { label: "Falhou", variant: "destructive" as const },
  };

  const { label, variant } =
    config[status as keyof typeof config] || config.pending;

  return <Badge variant={variant}>{label}</Badge>;
}


