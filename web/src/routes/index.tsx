import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Analysis } from "@/types/convex";
import {
  FileText,
  TrendingUp,
  Loader2,
  AlertCircle,
  Play,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { UploadZone } from "@/components/upload-zone";
import { AnalysisConfigDialog } from "@/components/analysis-config-dialog";
import { formatBytes } from "@/lib/utils";
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

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const stats = useQuery(api.analyses.stats);
  const analyses = useQuery(api.analyses.list);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const generateUploadUrl = useMutation(api.analyses.generateUploadUrl);
  const createAnalysis = useMutation(api.analyses.create);

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

      await createAnalysis({
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

  if (stats === undefined || analyses === undefined) {
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
          title="Total"
          value={stats.total}
          icon={<FileText className="w-4 h-4" />}
          variant="default"
        />
        <StatsCard
          title="Processando"
          value={stats.processing}
          icon={<TrendingUp className="w-4 h-4" />}
          variant="warning"
        />
        <StatsCard
          title="Concluídos"
          value={stats.completed}
          icon={<CheckCircle2 className="w-4 h-4" />}
          variant="success"
        />
        <StatsCard
          title="Custo Total"
          value={`$${stats.totalCost.toFixed(2)}`}
          icon={<TrendingUp className="w-4 h-4" />}
          variant="info"
        />
      </div>

      {/* Analyses List */}
      <div className="space-y-4">
        <h2 className="font-medium">Análises Recentes</h2>

        {analyses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-16 h-16 mb-4 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-semibold">
                Nenhuma análise ainda
              </h3>
              <p className="text-sm text-muted-foreground">
                Use o upload acima para enviar seu primeiro EIA
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progresso</TableHead>
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
          </Card>
        )}
      </div>
    </div>
  );
}

function AnalysisRow({ analysis }: { analysis: Analysis }) {
  const getFileUrl = useQuery(api.analyses.getFileUrl, { fileId: analysis.fileId as any });
  const [starting, setStarting] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  const handleStart = async (config: any) => {
    setStarting(true);
    setConfigOpen(false);
    try {
      if (!getFileUrl) {
        throw new Error("File URL not available");
      }

      // For local development, call API directly from frontend
      const siteUrl = import.meta.env.VITE_CONVEX_SITE_URL;
      const callbackUrl = `${siteUrl}/analysis-webhook`;

      // Call API directly (bypass Convex action restriction on localhost)
      const apiUrl = "http://localhost:3001";
      const response = await fetch(`${apiUrl}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: getFileUrl,
          analysisId: analysis._id,
          callbackUrl,
          config,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API error: ${error}`);
      }

      const result = await response.json();
      console.log("Analysis started:", result);
    } catch (err) {
      console.error("Failed to start analysis:", err);
      alert(err instanceof Error ? err.message : "Failed to start analysis");
    } finally {
      setStarting(false);
    }
  };

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <div>
              <div className="font-medium">{analysis.fileName}</div>
              <div className="text-sm text-muted-foreground">
                {(analysis.fileSize / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <StatusBadge status={analysis.status} />
        </TableCell>
        <TableCell>
          {analysis.progress ? (
            <div className="flex items-center gap-2">
              <Progress value={analysis.progress.percentage} className="w-24" />
              <span className="text-sm text-muted-foreground">
                {analysis.progress.percentage}%
              </span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
        </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {new Date(analysis.createdAt).toLocaleDateString("pt-BR")}
      </TableCell>
      <TableCell className="text-right">
        {analysis.status === "pending" && (
          <Button
            onClick={() => setConfigOpen(true)}
            disabled={starting}
            size="sm"
            className="gap-2"
          >
            {starting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {starting ? "Iniciando..." : "Iniciar"}
          </Button>
        )}
        {analysis.status === "processing" && (
          <Badge variant="outline" className="gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Processando
          </Badge>
        )}
        {analysis.status === "completed" && (
          <Button variant="outline" size="sm" asChild>
            <Link to="/analysis/$id" params={{ id: analysis._id }}>
              Ver Resultado
            </Link>
          </Button>
        )}
        {analysis.status === "failed" && (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3 h-3" />
            Falhou
          </Badge>
        )}
      </TableCell>
    </TableRow>

      <AnalysisConfigDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        onConfirm={handleStart}
        loading={starting}
      />
    </>
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
