import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { AnalysisWithStudy, AnalysisResult, AnalysisConfig } from "@/types/convex";
import type { Id } from "@/../convex/_generated/dataModel";
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
import { formatBytes } from "@/lib/utils";
import { getProviderName } from "@/lib/constants";

export const Route = createFileRoute("/analysis/$id")({
  component: AnalysisDetailPage,
});

function AnalysisDetailPage() {
  const { id } = Route.useParams();
  const analysis = useQuery(api.analyses.get, { id: id as Id<"analyses"> }) as AnalysisWithStudy | null | undefined;

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

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(analysis.result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const fileName = analysis.study?.fileName || "analysis";
    a.download = `${fileName.replace(".pdf", "")}-resultado.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    const markdown = generateMarkdownReport(analysis);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const fileName = analysis.study?.fileName || "analysis";
    a.download = `${fileName.replace(".pdf", "")}-relatorio.md`;
    a.click();
    URL.revokeObjectURL(url);
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
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadJSON}>
              <Download className="mr-2 h-4 w-4" />
              JSON
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadMarkdown}>
              <Download className="mr-2 h-4 w-4" />
              Markdown
            </Button>
          </div>
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
        <AnalysisResults result={analysis.result} />
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

function AnalysisResults({ result }: { result: AnalysisResult }) {
  return (
    <div className="space-y-6">
      {/* Summary Card */}
      {result.notaGeral && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Resultado Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="mb-1 text-3xl font-bold text-green-600">
                  {result.notaGeral}/10
                </div>
                <p className="text-sm text-muted-foreground">Nota Geral</p>
              </div>
              <div className="text-center">
                <div className="mb-1 text-2xl font-bold">
                  {result.classificacao}
                </div>
                <p className="text-sm text-muted-foreground">Classificacao</p>
              </div>
              <div className="text-center">
                <div className="mb-1 text-2xl font-bold">
                  {result.problemasCriticos || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  Problemas Criticos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phases */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Fases da Analise</h2>

        {/* Phase 1: Deep Reading */}
        {result.fase1 && (
          <PhaseCard
            number={1}
            title="Leitura Profunda"
            description="Compreensao geral do documento"
            content={result.fase1}
          />
        )}

        {/* Phase 2: Specialized Analysis */}
        {result.fase2 && (
          <PhaseCard
            number={2}
            title="Analise Especializada"
            description="Analises paralelas de diferentes aspectos"
            content={result.fase2}
          />
        )}

        {/* Phase 3: Cross Validation */}
        {result.fase3 && (
          <PhaseCard
            number={3}
            title="Verificacao Cruzada"
            description="Validacao entre analises especializadas"
            content={result.fase3}
          />
        )}

        {/* Phase 4: Final Report */}
        {result.fase4 && (
          <PhaseCard
            number={4}
            title="Consolidacao Final"
            description="Relatorio tecnico completo"
            content={result.fase4}
          />
        )}
      </div>

      {/* Recommendations */}
      {result.recomendacoes && result.recomendacoes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recomendacoes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.recomendacoes.map((rec: string, index: number) => (
                <li key={index} className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PhaseCard({
  number,
  title,
  description,
  content,
}: {
  number: number;
  title: string;
  description: string;
  content: unknown;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            {number}
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm">
            {typeof content === "string"
              ? content
              : JSON.stringify(content, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
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


function generateMarkdownReport(analysis: AnalysisWithStudy): string {
  const result = analysis.result;
  const fileName = analysis.study?.fileName || "Documento";

  return `# Relatorio de Analise EIA

## Informacoes do Arquivo
- **Nome:** ${fileName}
- **Tamanho:** ${analysis.study ? formatBytes(analysis.study.fileSize) : "N/A"}
- **Data:** ${new Date(analysis.createdAt).toLocaleDateString("pt-BR")}
- **Status:** ${analysis.status}

## Configuracao da Analise
- **Provedor:** ${getProviderName(analysis.config.provider)}
- **Modelo:** ${analysis.config.model}
- **Temperatura:** ${analysis.config.temperature}
- **Reasoning:** ${analysis.config.enableThinking ? "Ativo" : "Desativado"}

## Resultado Geral
- **Nota:** ${result?.notaGeral || "N/A"}/10
- **Classificacao:** ${result?.classificacao || "N/A"}
- **Problemas Criticos:** ${result?.problemasCriticos || 0}

---

## Fase 1: Leitura Profunda
${typeof result?.fase1 === "string" ? result.fase1 : JSON.stringify(result?.fase1, null, 2)}

---

## Fase 2: Analise Especializada
${typeof result?.fase2 === "string" ? result.fase2 : JSON.stringify(result?.fase2, null, 2)}

---

## Fase 3: Verificacao Cruzada
${typeof result?.fase3 === "string" ? result.fase3 : JSON.stringify(result?.fase3, null, 2)}

---

## Fase 4: Consolidacao Final
${typeof result?.fase4 === "string" ? result.fase4 : JSON.stringify(result?.fase4, null, 2)}

---

## Recomendacoes
${result?.recomendacoes?.map((r: string, i: number) => `${i + 1}. ${r}`).join("\n") || "Nenhuma recomendacao disponivel"}

---

*Relatorio gerado automaticamente pelo EIA Analyzer*
`;
}
