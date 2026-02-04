import { useState } from "react";
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
import { Sparkles, Zap, DollarSign, Settings2, ChevronDown, ChevronUp } from "lucide-react";

interface AnalysisConfig {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  enableThinking: boolean;
  thinkingBudget: number;
}

interface AnalysisConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (config: AnalysisConfig) => void;
  loading?: boolean;
}

const PROVIDERS = {
  deepseek: {
    name: "DeepSeek",
    models: [
      { id: "deepseek-reasoner", name: "DeepSeek R1 (Reasoner)", reasoning: true },
      { id: "deepseek-chat", name: "DeepSeek v3", reasoning: false },
    ],
    icon: "🧠",
    color: "blue",
  },
  openai: {
    name: "OpenAI",
    models: [
      { id: "gpt-4-turbo", name: "GPT-4 Turbo", reasoning: false },
      { id: "gpt-4", name: "GPT-4", reasoning: false },
      { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", reasoning: false },
    ],
    icon: "🤖",
    color: "green",
  },
  anthropic: {
    name: "Anthropic",
    models: [
      { id: "claude-opus-4-5", name: "Claude Opus 4.5", reasoning: false },
      { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5", reasoning: false },
    ],
    icon: "🎭",
    color: "purple",
  },
  openrouter: {
    name: "OpenRouter",
    models: [
      { id: "moonshotai/kimi-k2.5", name: "Kimi K2.5", reasoning: true },
      { id: "google/gemini-2.0-flash-exp", name: "Gemini 2.0 Flash", reasoning: false },
      { id: "qwen/qwen-2.5-72b-instruct", name: "Qwen 2.5 72B", reasoning: false },
    ],
    icon: "🌐",
    color: "orange",
  },
};

export function AnalysisConfigDialog({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: AnalysisConfigDialogProps) {
  const [config, setConfig] = useState<AnalysisConfig>({
    provider: "deepseek",
    model: "deepseek-reasoner",
    temperature: 0.3,
    maxTokens: 16000,
    enableThinking: true,
    thinkingBudget: 5000,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const currentProvider = PROVIDERS[config.provider as keyof typeof PROVIDERS];
  const currentModel = currentProvider.models.find((m) => m.id === config.model);
  const supportsThinking = currentModel?.reasoning || false;

  const handleConfirm = () => {
    onConfirm(config);
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
            <Select
              value={config.provider}
              onValueChange={(value) => {
                const provider = PROVIDERS[value as keyof typeof PROVIDERS];
                setConfig({
                  ...config,
                  provider: value,
                  model: provider.models[0].id,
                  enableThinking: provider.models[0].reasoning,
                });
              }}
            >
              <SelectTrigger id="provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROVIDERS).map(([key, provider]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span>{provider.icon}</span>
                      <span>{provider.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="model">Modelo</Label>
            <Select
              value={config.model}
              onValueChange={(value) => {
                const model = currentProvider.models.find((m) => m.id === value);
                setConfig({
                  ...config,
                  model: value,
                  enableThinking: model?.reasoning || false,
                });
              }}
            >
              <SelectTrigger id="model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currentProvider.models.map((model) => (
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
              {supportsThinking && (
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
              value={supportsThinking ? "Alta" : "Padrão"}
            />
            <InfoCard
              icon={<DollarSign className="h-4 w-4" />}
              label="Custo Est."
              value="~$5-8"
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
