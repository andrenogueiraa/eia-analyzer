import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { StudyWithCounts, Analysis, AnalysisConfig } from "@/types/convex";
import {
  FileText,
  TrendingUp,
  Loader2,
  AlertCircle,
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  BarChart3,
} from "lucide-react";
import { UploadZone } from "@/components/upload-zone";
import { AnalysisConfigDialog } from "@/components/analysis-config-dialog";
import { formatBytes } from "@/lib/utils";
import { getModelDisplayName } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const stats = useQuery(api.studies.stats);
  const studies = useQuery(api.studies.list);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const generateUploadUrl = useMutation(api.studies.generateUploadUrl);
  const createStudy = useMutation(api.studies.create);

  const handleUpload = async (file: File) => {
    setSelectedFile(file);
    setError(null);
    setUploading(true);

    try {
      const uploadUrl = await generateUploadUrl();

      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Falha no upload do arquivo");
      }

      const { storageId } = await result.json();

      await createStudy({
        fileName: file.name,
        fileId: storageId,
        fileSize: file.size,
      });

      setSelectedFile(null);
      setUploading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer upload");
      setUploading(false);
    }
  };

  if (stats === undefined || studies === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <div className="space-y-4">
        {!uploading && !selectedFile && !error && (
          <UploadZone onUpload={handleUpload} disabled={uploading} />
        )}

        {selectedFile && uploading && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <div className="text-center">
                  <h3 className="text-lg font-semibold">Fazendo upload...</h3>
                  <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    <span>{selectedFile.name}</span>
                    <span>({formatBytes(selectedFile.size)})</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Erro no Upload</AlertTitle>
            <AlertDescription>
              <p className="mb-4">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setError(null);
                  setSelectedFile(null);
                }}
              >
                Tentar Novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Estudos"
          value={stats.totalStudies}
          icon={<FileText className="w-4 h-4" />}
          variant="default"
        />
        <StatsCard
          title="Análises"
          value={stats.totalAnalyses}
          icon={<BarChart3 className="w-4 h-4" />}
          variant="info"
        />
        <StatsCard
          title="Processando"
          value={stats.processing}
          icon={<TrendingUp className="w-4 h-4" />}
          variant="warning"
        />
        <StatsCard
          title="Custo Total"
          value={`$${stats.totalCost.toFixed(2)}`}
          icon={<TrendingUp className="w-4 h-4" />}
          variant="success"
        />
      </div>

      {/* Studies List */}
      <div className="space-y-4">
        <h2 className="font-medium">Estudos</h2>

        {studies.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-16 h-16 mb-4 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-semibold">
                Nenhum estudo ainda
              </h3>
              <p className="text-sm text-muted-foreground">
                Use o upload acima para enviar seu primeiro EIA
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {studies.map((study) => (
              <StudyRow key={study._id} study={study} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StudyRow({ study }: { study: StudyWithCounts }) {
  const [isOpen, setIsOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const studyWithAnalyses = useQuery(api.studies.get, { id: study._id });
  const getFileUrl = useQuery(api.studies.getFileUrl, { fileId: study.fileId });
  const createAnalysis = useMutation(api.analyses.create);
  const removeStudy = useMutation(api.studies.remove);

  const handleNewAnalysis = async (config: AnalysisConfig) => {
    setStarting(true);
    setConfigOpen(false);

    try {
      // Create analysis record
      const analysisId = await createAnalysis({
        studyId: study._id,
        config,
      });

      if (!getFileUrl) {
        throw new Error("File URL not available");
      }

      // Start analysis via API
      const siteUrl = import.meta.env.VITE_CONVEX_SITE_URL;
      const callbackUrl = `${siteUrl}/analysis-webhook`;

      const apiUrl = "http://localhost:3001";
      const response = await fetch(`${apiUrl}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: getFileUrl,
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

  const handleDelete = async () => {
    try {
      await removeStudy({ id: study._id });
    } catch (err) {
      console.error("Failed to delete study:", err);
      alert(err instanceof Error ? err.message : "Failed to delete study");
    }
  };

  const analyses = studyWithAnalyses?.analyses || [];

  return (
    <>
      <Card>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isOpen ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <CardTitle className="text-base">{study.fileName}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {formatBytes(study.fileSize)} • {study.analysisCount} análise{study.analysisCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {study.processingCount > 0 && (
                    <Badge variant="outline" className="gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {study.processingCount} processando
                    </Badge>
                  )}
                  {study.completedCount > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {study.completedCount} concluída{study.completedCount !== 1 ? "s" : ""}
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {new Date(study.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfigOpen(true);
                    }}
                    disabled={starting}
                    className="gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Nova Análise
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => e.stopPropagation()}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Estudo</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir "{study.fileName}" e todas as suas análises?
                          Esta ação não pode ser desfeita.
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
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0">
              {analyses.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p>Nenhuma análise realizada ainda.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfigOpen(true)}
                    className="mt-2 gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Iniciar primeira análise
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Nota</TableHead>
                      <TableHead>Custo</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyses.map((analysis) => (
                      <AnalysisRow key={analysis._id} analysis={analysis} />
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <AnalysisConfigDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        onConfirm={handleNewAnalysis}
        loading={starting}
      />
    </>
  );
}

function AnalysisRow({ analysis }: { analysis: Analysis }) {
  const resetStatus = useMutation(api.analyses.resetStatus);
  const removeAnalysis = useMutation(api.analyses.remove);
  const [retrying, setRetrying] = useState(false);

  const getModelName = (config: AnalysisConfig) => {
    return getModelDisplayName(config.provider, config.model);
  };

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await resetStatus({ id: analysis._id });
      // The parent component will handle starting the analysis when it becomes pending
    } catch (err) {
      console.error("Failed to reset analysis:", err);
    } finally {
      setRetrying(false);
    }
  };

  const handleDelete = async () => {
    try {
      await removeAnalysis({ id: analysis._id });
    } catch (err) {
      console.error("Failed to delete analysis:", err);
    }
  };

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium text-sm">
          {getModelName(analysis.config)}
        </div>
        {analysis.config.enableThinking && (
          <Badge variant="secondary" className="text-xs mt-1">
            Reasoning
          </Badge>
        )}
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
        {new Date(analysis.createdAt).toLocaleDateString("pt-BR")}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          {analysis.status === "completed" && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/analysis/$id" params={{ id: analysis._id }}>
                Ver Resultado
              </Link>
            </Button>
          )}
          {analysis.status === "failed" && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRetry}
              disabled={retrying}
            >
              {retrying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Tentar Novamente"
              )}
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

function StatsCard({
  title,
  value,
  icon,
  variant,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  variant: "default" | "warning" | "success" | "info";
}) {
  const variantClasses = {
    default: "bg-blue-500/10 text-blue-600",
    warning: "bg-yellow-500/10 text-yellow-600",
    success: "bg-green-500/10 text-green-600",
    info: "bg-purple-500/10 text-purple-600",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`rounded-lg p-1 ${variantClasses[variant]}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl">{value}</div>
      </CardContent>
    </Card>
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
