import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles,
  Zap,
  DollarSign,
  Settings2,
  ChevronDown,
  ChevronUp,
  Eye,
  Wrench,
  Brain,
} from "lucide-react";
import type { AnalysisConfig } from "@/types/convex";
import { PROVIDERS, DEFAULT_ANALYSIS_CONFIG } from "@/lib/constants";

interface AnalysisConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (config: AnalysisConfig) => void;
  loading?: boolean;
}

export function AnalysisConfigDialog({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: AnalysisConfigDialogProps) {
  const [config, setConfig] = useState<AnalysisConfig>({
    ...DEFAULT_ANALYSIS_CONFIG,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Queries dinâmicas do Convex
  const providers = useQuery(api.providers.listProviders);
  const providerModels = useQuery(
    api.providers.getModelsForProvider,
    config.provider ? { providerSlug: config.provider } : "skip"
  );

  // Fallback para dados estáticos se banco estiver vazio
  const hasProviders = providers && providers.length > 0;
  const hasModels = providerModels && providerModels.length > 0;

  // Encontra o model atual selecionado
  const currentProviderModel = providerModels?.find(
    (pm) => pm.modelIdentifier === config.model
  );
  const supportsThinking = currentProviderModel?.model?.supportsThinking || false;

  // Fallback para providers estáticos se banco vazio
  const staticProvider = PROVIDERS[config.provider as keyof typeof PROVIDERS];
  const staticModel = staticProvider?.models.find((m) => m.id === config.model);
  const fallbackSupportsThinking = staticModel?.reasoning || false;

  // Determina se thinking é suportado (banco ou fallback)
  const thinkingEnabled = hasModels ? supportsThinking : fallbackSupportsThinking;

  // Atualiza enableThinking quando modelo muda
  useEffect(() => {
    if (hasModels && currentProviderModel) {
      setConfig((prev) => ({
        ...prev,
        enableThinking: currentProviderModel.model?.supportsThinking || false,
      }));
    }
  }, [hasModels, currentProviderModel]);

  // Calcula custo estimado baseado nos tokens configurados
  const estimatedCost = (() => {
    if (!currentProviderModel) return "~$5-8";

    const inputTokensEstimate = 50000; // ~50k tokens para um EIA típico
    const outputTokensEstimate = config.maxTokens;
    const thinkingTokensEstimate = config.enableThinking ? config.thinkingBudget : 0;

    const inputCost =
      (inputTokensEstimate / 1_000_000) * currentProviderModel.inputCostPer1M;
    const outputCost =
      (outputTokensEstimate / 1_000_000) * currentProviderModel.outputCostPer1M;
    const thinkingRate =
      currentProviderModel.thinkingCostPer1M ?? currentProviderModel.outputCostPer1M;
    const thinkingCost = (thinkingTokensEstimate / 1_000_000) * thinkingRate;

    const total = inputCost + outputCost + thinkingCost;
    return `~$${total.toFixed(2)}`;
  })();

  const handleConfirm = () => {
    onConfirm(config);
  };

  const handleProviderChange = (providerSlug: string) => {
    // Usa dados do banco se disponíveis
    if (hasProviders) {
      const newProviderModels = providerModels || [];
      const defaultModel = newProviderModels.find((pm) => pm.isDefault);
      const firstModel = newProviderModels[0];
      const modelToUse = defaultModel || firstModel;

      setConfig({
        ...config,
        provider: providerSlug,
        model: modelToUse?.modelIdentifier || "",
        enableThinking: modelToUse?.model?.supportsThinking || false,
      });
    } else {
      // Fallback para dados estáticos
      const provider = PROVIDERS[providerSlug as keyof typeof PROVIDERS];
      setConfig({
        ...config,
        provider: providerSlug,
        model: provider.models[0].id,
        enableThinking: provider.models[0].reasoning,
      });
    }
  };

  const handleModelChange = (modelIdentifier: string) => {
    if (hasModels) {
      const model = providerModels?.find(
        (pm) => pm.modelIdentifier === modelIdentifier
      );
      setConfig({
        ...config,
        model: modelIdentifier,
        enableThinking: model?.model?.supportsThinking || false,
      });
    } else {
      // Fallback para dados estáticos
      const staticModel = staticProvider?.models.find(
        (m) => m.id === modelIdentifier
      );
      setConfig({
        ...config,
        model: modelIdentifier,
        enableThinking: staticModel?.reasoning || false,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Configurar Análise
          </DialogTitle>
          <DialogDescription>
            Escolha o provedor de IA e ajuste os parâmetros para a análise do EIA
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="provider">Provedor de IA</Label>
            {providers === undefined ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={config.provider}
                onValueChange={handleProviderChange}
              >
                <SelectTrigger id="provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hasProviders
                    ? providers.map((provider) => (
                        <SelectItem key={provider.slug} value={provider.slug}>
                          <div className="flex items-center gap-2">
                            <span>{provider.name}</span>
                            {provider.description && (
                              <span className="text-xs text-muted-foreground">
                                ({provider.description})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    : Object.entries(PROVIDERS).map(([key, provider]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <span>{provider.icon}</span>
                            <span>{provider.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="model">Modelo</Label>
            {providerModels === undefined && hasProviders ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={config.model} onValueChange={handleModelChange}>
                <SelectTrigger id="model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hasModels
                    ? providerModels.map((pm) => (
                        <SelectItem
                          key={pm.modelIdentifier}
                          value={pm.modelIdentifier}
                        >
                          <div className="flex items-center gap-2">
                            <span>{pm.model?.name || pm.modelIdentifier}</span>
                            <div className="flex gap-1">
                              {pm.model?.supportsThinking && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs px-1.5"
                                >
                                  <Brain className="h-3 w-3" />
                                </Badge>
                              )}
                              {pm.model?.supportsTools && (
                                <Badge
                                  variant="outline"
                                  className="text-xs px-1.5"
                                >
                                  <Wrench className="h-3 w-3" />
                                </Badge>
                              )}
                              {pm.model?.supportsVision && (
                                <Badge
                                  variant="outline"
                                  className="text-xs px-1.5"
                                >
                                  <Eye className="h-3 w-3" />
                                </Badge>
                              )}
                            </div>
                            {pm.isDefault && (
                              <Badge variant="default" className="text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    : staticProvider?.models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-2">
                            <span>{model.name}</span>
                            {model.reasoning && (
                              <Badge variant="secondary" className="text-xs">
                                <Sparkles className="mr-1 h-3 w-3" />
                                Reasoning
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Advanced Settings Toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full gap-2"
          >
            <Settings2 className="h-4 w-4" />
            Configurações Avançadas
            {showAdvanced ? (
              <ChevronUp className="ml-auto h-4 w-4" />
            ) : (
              <ChevronDown className="ml-auto h-4 w-4" />
            )}
          </Button>

          {/* Advanced Settings */}
          {showAdvanced && (
            <>
              <Separator />

              {/* Temperature */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="temperature">Temperatura</Label>
                  <span className="text-sm text-muted-foreground">
                    {config.temperature.toFixed(1)}
                  </span>
                </div>
                <Slider
                  id="temperature"
                  min={0}
                  max={1}
                  step={0.1}
                  value={[config.temperature]}
                  onValueChange={([value]) =>
                    setConfig({ ...config, temperature: value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Controla a aleatoriedade. Menor = mais focado, Maior = mais criativo
                </p>
              </div>

              {/* Max Tokens */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="maxTokens">Tokens Máximos</Label>
                  <span className="text-sm text-muted-foreground">
                    {config.maxTokens.toLocaleString()}
                  </span>
                </div>
                <Slider
                  id="maxTokens"
                  min={4000}
                  max={32000}
                  step={1000}
                  value={[config.maxTokens]}
                  onValueChange={([value]) =>
                    setConfig({ ...config, maxTokens: value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Limite de tokens para a resposta
                </p>
              </div>

              {/* Thinking Budget (only for reasoning models) */}
              {thinkingEnabled && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="thinkingBudget">Thinking Budget</Label>
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Sparkles className="h-3 w-3" />
                        Reasoning
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {config.thinkingBudget.toLocaleString()}
                    </span>
                  </div>
                  <Slider
                    id="thinkingBudget"
                    min={1000}
                    max={15000}
                    step={1000}
                    value={[config.thinkingBudget]}
                    onValueChange={([value]) =>
                      setConfig({ ...config, thinkingBudget: value })
                    }
                    disabled={!config.enableThinking}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tokens dedicados ao raciocínio interno do modelo
                  </p>
                </div>
              )}
            </>
          )}

          <Separator />

          {/* Info Cards */}
          <div className="grid gap-3 md:grid-cols-3">
            <InfoCard
              icon={<Zap className="h-4 w-4" />}
              label="Qualidade"
              value={thinkingEnabled ? "Alta" : "Padrão"}
            />
            <InfoCard
              icon={<DollarSign className="h-4 w-4" />}
              label="Custo Est."
              value={estimatedCost}
            />
            <InfoCard
              icon={<Sparkles className="h-4 w-4" />}
              label="Tempo Est."
              value="3-5 min"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "Iniciando..." : "Iniciar Análise"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className="rounded-md bg-primary/10 p-2 text-primary">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
