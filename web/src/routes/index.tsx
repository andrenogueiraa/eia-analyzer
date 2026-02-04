import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Upload, FileText, TrendingUp, Loader2, AlertCircle, CheckCircle, Play } from "lucide-react";
import { UploadZone } from "../components/upload-zone";
import { formatBytes } from "../lib/utils";

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
      // Step 1: Generate upload URL
      const uploadUrl = await generateUploadUrl();

      // Step 2: Upload file to Convex storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Falha no upload do arquivo");
      }

      const { storageId } = await result.json();

      // Step 3: Create analysis record
      await createAnalysis({
        fileName: file.name,
        fileId: storageId,
        fileSize: file.size,
      });

      // Reset state
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
        <div className="w-12 h-12 border-b-2 border-green-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-600">
          Análises de Estudos de Impacto Ambiental
        </p>
      </div>

      {/* Upload Section */}
      <div className="mb-8">
        {!uploading && !selectedFile && !error && (
          <UploadZone onUpload={handleUpload} disabled={uploading} />
        )}

        {selectedFile && uploading && (
          <div className="p-8 bg-white border rounded-lg">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
            <div className="text-center">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Fazendo upload...
              </h3>
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <FileText className="w-5 h-5" />
                <span>{selectedFile.name}</span>
                <span className="text-sm text-gray-500">
                  ({formatBytes(selectedFile.size)})
                </span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="flex-shrink-0 w-6 h-6 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="mb-2 text-lg font-semibold text-red-900">
                  Erro no Upload
                </h3>
                <p className="mb-4 text-red-700">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    setSelectedFile(null);
                  }}
                  className="px-4 py-2 text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Tentar Novamente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 mb-8 md:grid-cols-4">
        <StatCard
          title="Total"
          value={stats.total}
          icon={<FileText className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Processando"
          value={stats.processing}
          icon={<TrendingUp className="w-6 h-6" />}
          color="yellow"
        />
        <StatCard
          title="Concluídos"
          value={stats.completed}
          icon={<FileText className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Custo Total"
          value={`$${stats.totalCost.toFixed(2)}`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* Analyses List */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Análises Recentes</h2>
      </div>

      {analyses.length === 0 ? (
        <div className="py-12 text-center border border-gray-200 border-dashed rounded-lg">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            Nenhuma análise ainda
          </h3>
          <p className="text-gray-600">
            Use o upload acima para enviar seu primeiro EIA
          </p>
        </div>
      ) : (
        <div className="overflow-hidden bg-white border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Arquivo
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Progresso
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Data
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analyses.map((analysis) => (
                <AnalysisRow key={analysis._id} analysis={analysis} />
              ))}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 mr-3 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {analysis.fileName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {(analysis.fileSize / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={analysis.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {analysis.progress ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 overflow-hidden bg-gray-200 rounded-full">
                          <div
                            className="h-full transition-all bg-blue-500"
                            style={{
                              width: `${analysis.progress.percentage}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {analysis.progress.percentage}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {new Date(analysis.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AnalysisRow({ analysis }: { analysis: any }) {
  const startAnalysis = useAction(api.analyses.startAnalysis);
  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    setStarting(true);
    try {
      const siteUrl = import.meta.env.VITE_CONVEX_SITE_URL;
      const callbackUrl = `${siteUrl}/analysis-webhook`;
      await startAnalysis({
        id: analysis._id,
        callbackUrl,
      });
    } catch (err) {
      console.error("Failed to start analysis:", err);
      alert(err instanceof Error ? err.message : "Failed to start analysis");
    } finally {
      setStarting(false);
    }
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <FileText className="w-5 h-5 mr-3 text-gray-400" />
          <div>
            <div className="text-sm font-medium text-gray-900">
              {analysis.fileName}
            </div>
            <div className="text-sm text-gray-500">
              {(analysis.fileSize / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={analysis.status} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {analysis.progress ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 overflow-hidden bg-gray-200 rounded-full">
              <div
                className="h-full transition-all bg-blue-500"
                style={{
                  width: `${analysis.progress.percentage}%`,
                }}
              />
            </div>
            <span className="text-sm text-gray-600">
              {analysis.progress.percentage}%
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-500">-</span>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
        {new Date(analysis.createdAt).toLocaleDateString("pt-BR")}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {analysis.status === "pending" && (
          <button
            onClick={handleStart}
            disabled={starting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {starting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {starting ? "Iniciando..." : "Iniciar"}
          </button>
        )}
        {analysis.status === "processing" && (
          <span className="text-sm text-blue-600">Processando...</span>
        )}
        {analysis.status === "completed" && (
          <button className="px-4 py-2 text-sm font-medium text-green-600 transition-colors bg-green-50 rounded-lg hover:bg-green-100">
            Ver Resultado
          </button>
        )}
        {analysis.status === "failed" && (
          <span className="text-sm text-red-600">Falhou</span>
        )}
      </td>
    </tr>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: "blue" | "green" | "yellow" | "purple";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    yellow: "bg-yellow-50 text-yellow-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
    processing: { label: "Processando", color: "bg-blue-100 text-blue-800" },
    completed: { label: "Concluído", color: "bg-green-100 text-green-800" },
    failed: { label: "Falhou", color: "bg-red-100 text-red-800" },
  };

  const config =
    statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.color}`}
    >
      {config.label}
    </span>
  );
}
