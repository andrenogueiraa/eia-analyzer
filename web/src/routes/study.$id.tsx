import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Analysis, AnalysisConfig } from "@/types/convex";
import {
  ArrowLeft,
  FileText,
  Plus,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { AnalysisConfigDialog } from "@/components/analysis-config-dialog";
import { formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/study/$id")({
  component: StudyDetailPage,
});

function StudyDetailPage() {
  const { id } = Route.useParams();
  const study = useQuery(api.studies.get, { id: id as any });
  const fileUrl = useQuery(api.studies.getFileUrl, {
    fileId: study?.fileId as any,
  });
  const [configOpen, setConfigOpen] = useState(false);
  const [starting, setStarting] = useState(false);

  const createAnalysis = useMutation(api.analyses.create);

  const handleNewAnalysis = async (config: AnalysisConfig) => {
    setStarting(true);
    setConfigOpen(false);

    try {
      const analysisId = await createAnalysis({
        studyId: id as any,
        config,
      });

      if (!fileUrl) {
        throw new Error("File URL not available");
      }

      const siteUrl = import.meta.env.VITE_CONVEX_SITE_URL;
      const callbackUrl = `${siteUrl}/analysis-webhook`;

      const apiUrl = "http://localhost:3001";
      const response = await fetch(`${apiUrl}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl,
          analysisId,
          callbackUrl,
          config,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API error: ${error}`);
      }

      console.log("Analysis started:", await response.json());
    } catch (err) {
      console.error("Failed to start analysis:", err);
      alert(err instanceof Error ? err.message : "Failed to start analysis");
    } finally {
      setStarting(false);
    }
  };

  if (study === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!study) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
          <h3 className="mb-2 text-lg font-semibold">Estudo não encontrado</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            O estudo solicitado não existe ou foi removido
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

  const analyses = study.analyses || [];
  const completedAnalyses = analyses.filter((a) => a.status === "completed");
  const bestScore = completedAnalyses.length > 0
    ? Math.max(...completedAnalyses.map((a) => a.result?.notaGeral || 0))
    : null;

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
              Detalhes do Estudo
            </h1>
          </div>
          <p className="text-muted-foreground">{study.fileName}</p>
        </div>
        <div className="flex gap-2">
          {fileUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver PDF
              </a>
            </Button>
          )}
          <Button onClick={() => setConfigOpen(true)} disabled={starting}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Análise
          </Button>
        </div>
      </div>

      {/* Study Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informações do Documento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <InfoItem label="Nome" value={study.fileName} />
            <InfoItem label="Tamanho" value={formatBytes(study.fileSize)} />
            <InfoItem
              label="Upload"
              value={new Date(study.createdAt).toLocaleDateString("pt-BR")}
            />
            <InfoItem
              label="Análises"
              value={`${analyses.length} total`}
            />
            <InfoItem
              label="Melhor Nota"
              value={bestScore !== null ? `${bestScore}/10` : "-"}
            />
          </div>
          {study.description && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">{study.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Card - only if we have completed analyses */}
      {completedAnalyses.length > 0 && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Resumo das Análises
            </CardTitle>
            <CardDescription>
              Comparação entre {completedAnalyses.length} análise{completedAnalyses.length !== 1 ? "s" : ""} concluída{completedAnalyses.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  {bestScore}/10
                </div>
                <p className="text-sm text-muted-foreground">Melhor Nota</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-3xl font-bold">
                  {(completedAnalyses.reduce((sum, a) => sum + (a.result?.notaGeral || 0), 0) / completedAnalyses.length).toFixed(1)}/10
                </div>
                <p className="text-sm text-muted-foreground">Média</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-3xl font-bold">
                  ${completedAnalyses.reduce((sum, a) => sum + (a.cost || 0), 0).toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground">Custo Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analyses List */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Análises</CardTitle>
          <CardDescription>
            Todas as análises realizadas neste documento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analyses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma análise realizada ainda.</p>
              <Button
                variant="outline"
                onClick={() => setConfigOpen(true)}
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" />
                Iniciar primeira análise
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Configuração</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Nota</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyses.map((analysis) => (
                  <StudyAnalysisRow key={analysis._id} analysis={analysis} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AnalysisConfigDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        onConfirm={handleNewAnalysis}
        loading={starting}
      />
    </div>
  );
}

function StudyAnalysisRow({ analysis }: { analysis: Analysis }) {
  const removeAnalysis = useMutation(api.analyses.remove);

  const getModelDisplayName = (config: AnalysisConfig) => {
    const providerNames: Record<string, string> = {
      deepseek: "DeepSeek",
      openai: "OpenAI",
      anthropic: "Anthropic",
      openrouter: "OpenRouter",
    };
    return providerNames[config.provider] || config.provider;
  };

  const getDuration = () => {
    if (!analysis.startedAt || !analysis.completedAt) return "-";
    const duration = analysis.completedAt - analysis.startedAt;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const handleDelete = async () => {
    try {
      await removeAnalysis({ id: analysis._id as any });
    } catch (err) {
      console.error("Failed to delete analysis:", err);
    }
  };

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{getModelDisplayName(analysis.config)}</div>
        <div className="text-sm text-muted-foreground">{analysis.config.model}</div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <span>Temp: {analysis.config.temperature}</span>
          {analysis.config.enableThinking && (
            <Badge variant="secondary" className="ml-2 text-xs">
              Reasoning
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge status={analysis.status} />
        {analysis.status === "processing" && analysis.progress && (
          <div className="flex items-center gap-2 mt-1">
            <Progress value={analysis.progress.percentage} className="w-16 h-1" />
            <span className="text-xs text-muted-foreground">
              {analysis.progress.percentage}%
            </span>
          </div>
        )}
      </TableCell>
      <TableCell>
        {analysis.status === "completed" && analysis.result?.notaGeral ? (
          <span className="font-semibold text-green-600">
            {analysis.result.notaGeral}/10
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        {analysis.cost ? (
          <span>${analysis.cost.toFixed(2)}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {getDuration()}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {new Date(analysis.createdAt).toLocaleDateString("pt-BR")}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          {analysis.status === "completed" && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/analysis/$id" params={{ id: analysis._id }}>
                Ver Detalhes
              </Link>
            </Button>
          )}
          {(analysis.status === "pending" || analysis.status === "failed") && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Análise</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir esta análise? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </TableCell>
    </TableRow>
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

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    pending: {
      label: "Pendente",
      variant: "secondary" as const,
      icon: Clock,
    },
    processing: {
      label: "Processando",
      variant: "default" as const,
      icon: Loader2,
    },
    completed: {
      label: "Concluído",
      variant: "default" as const,
      icon: CheckCircle2,
    },
    failed: {
      label: "Falhou",
      variant: "destructive" as const,
      icon: XCircle,
    },
  };

  const config =
    statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon
        className={`h-3 w-3 ${status === "processing" ? "animate-spin" : ""}`}
      />
      {config.label}
    </Badge>
  );
}
