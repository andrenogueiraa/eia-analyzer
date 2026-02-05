import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Provider, Model, ProviderModelEnriched } from "@/types/convex";
import {
  Loader2,
  Server,
  Brain,
  Wrench,
  Eye,
  Check,
  X,
  DollarSign,
  Cpu,
  Layers,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/models")({
  component: ModelsPage,
});

function ModelsPage() {
  const providers = useQuery(api.providers.listProviders);
  const models = useQuery(api.providers.listModels);
  const providerModels = useQuery(api.providers.listProviderModels, {});
  const [familyFilter, setFamilyFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");

  const isLoading =
    providers === undefined ||
    models === undefined ||
    providerModels === undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Get unique families for filter
  const families = Array.from(new Set(models.map((m) => m.family))).sort();

  // Filter models by family
  const filteredModels =
    familyFilter === "all"
      ? models
      : models.filter((m) => m.family === familyFilter);

  // Filter provider models
  const filteredProviderModels =
    providerFilter === "all"
      ? providerModels
      : providerModels.filter((pm) => pm.provider?.slug === providerFilter);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Modelos de IA</h1>
        <p className="text-muted-foreground">
          Provedores, modelos e preços disponíveis para análise
        </p>
      </div>

      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="providers" className="gap-2">
            <Server className="w-4 h-4" />
            Provedores
          </TabsTrigger>
          <TabsTrigger value="models" className="gap-2">
            <Cpu className="w-4 h-4" />
            Modelos
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-2">
            <DollarSign className="w-4 h-4" />
            Preços
          </TabsTrigger>
        </TabsList>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {providers.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Server className="w-16 h-16 mb-4 text-muted-foreground/50" />
                  <h3 className="mb-2 text-lg font-semibold">
                    Nenhum provedor configurado
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Execute o seed para popular os dados
                  </p>
                </CardContent>
              </Card>
            ) : (
              providers.map((provider) => (
                <ProviderCard key={provider._id} provider={provider} />
              ))
            )}
          </div>
        </TabsContent>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filtrar:</span>
            </div>
            <Select value={familyFilter} onValueChange={setFamilyFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Família" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as famílias</SelectItem>
                {families.map((family) => (
                  <SelectItem key={family} value={family}>
                    {family}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Models Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Modelos Disponíveis
              </CardTitle>
              <CardDescription>
                {filteredModels.length} modelo{filteredModels.length !== 1 ? "s" : ""} encontrado{filteredModels.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredModels.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum modelo encontrado
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Família</TableHead>
                      <TableHead className="text-right">Contexto</TableHead>
                      <TableHead className="text-right">Max Output</TableHead>
                      <TableHead className="text-center">Thinking</TableHead>
                      <TableHead className="text-center">Tools</TableHead>
                      <TableHead className="text-center">Vision</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredModels.map((model) => (
                      <ModelRow key={model._id} model={model} />
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filtrar:</span>
            </div>
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Provedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os provedores</SelectItem>
                {providers.map((provider) => (
                  <SelectItem key={provider._id} value={provider.slug}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pricing Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Preços por Modelo
              </CardTitle>
              <CardDescription>
                Custo por 1M de tokens (USD)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredProviderModels.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum preço configurado
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provedor</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Identificador</TableHead>
                      <TableHead className="text-right">Input $/1M</TableHead>
                      <TableHead className="text-right">Output $/1M</TableHead>
                      <TableHead className="text-right">Thinking $/1M</TableHead>
                      <TableHead className="text-center">Default</TableHead>
                      <TableHead>Notas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProviderModels.map((pm) => (
                      <PricingRow key={pm._id} providerModel={pm} />
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProviderCard({ provider }: { provider: Provider }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            {provider.name}
          </CardTitle>
          <Badge variant={provider.isActive ? "default" : "secondary"}>
            {provider.isActive ? "Ativo" : "Inativo"}
          </Badge>
        </div>
        {provider.description && (
          <CardDescription>{provider.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Slug:</span>
            <code className="px-2 py-0.5 rounded bg-muted text-xs">
              {provider.slug}
            </code>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Base URL:</span>
            <span className="text-xs truncate max-w-[200px]">
              {provider.baseUrl}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ModelRow({ model }: { model: Model }) {
  return (
    <TableRow>
      <TableCell>
        <div>
          <span className="font-medium">{model.name}</span>
          {model.description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {model.description}
            </p>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{model.family}</Badge>
      </TableCell>
      <TableCell className="text-right font-mono text-sm">
        {formatTokenCount(model.contextWindow)}
      </TableCell>
      <TableCell className="text-right font-mono text-sm">
        {formatTokenCount(model.maxOutputTokens)}
      </TableCell>
      <TableCell className="text-center">
        <CapabilityIcon enabled={model.supportsThinking} icon={Brain} />
      </TableCell>
      <TableCell className="text-center">
        <CapabilityIcon enabled={model.supportsTools} icon={Wrench} />
      </TableCell>
      <TableCell className="text-center">
        <CapabilityIcon enabled={model.supportsVision} icon={Eye} />
      </TableCell>
    </TableRow>
  );
}

function PricingRow({ providerModel }: { providerModel: ProviderModelEnriched }) {
  return (
    <TableRow>
      <TableCell>
        <Badge variant="secondary">{providerModel.provider?.name || "-"}</Badge>
      </TableCell>
      <TableCell>
        <span className="font-medium">
          {providerModel.model?.name || "-"}
        </span>
      </TableCell>
      <TableCell>
        <code className="px-2 py-0.5 rounded bg-muted text-xs">
          {providerModel.modelIdentifier}
        </code>
      </TableCell>
      <TableCell className="text-right font-mono">
        ${providerModel.inputCostPer1M.toFixed(2)}
      </TableCell>
      <TableCell className="text-right font-mono">
        ${providerModel.outputCostPer1M.toFixed(2)}
      </TableCell>
      <TableCell className="text-right font-mono">
        {providerModel.thinkingCostPer1M
          ? `$${providerModel.thinkingCostPer1M.toFixed(2)}`
          : "-"}
      </TableCell>
      <TableCell className="text-center">
        {providerModel.isDefault ? (
          <Check className="w-4 h-4 text-green-500 mx-auto" />
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
        {providerModel.notes || "-"}
      </TableCell>
    </TableRow>
  );
}

function CapabilityIcon({
  enabled,
  icon: Icon,
}: {
  enabled: boolean;
  icon: typeof Brain;
}) {
  if (enabled) {
    return <Icon className="w-4 h-4 text-green-500 mx-auto" />;
  }
  return <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />;
}

function formatTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(0)}k`;
  }
  return tokens.toString();
}
