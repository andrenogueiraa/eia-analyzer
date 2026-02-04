import { createFileRoute } from "@tanstack/react-router";
import { Leaf, Zap, Database, BarChart3, Shield, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-green-500/10 p-3">
            <Leaf className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">EIA Analyzer</h1>
            <p className="text-muted-foreground">
              Sistema de análise automatizada de Estudos de Impacto Ambiental
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Features */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Recursos</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Zap className="h-5 w-5" />}
            title="Análise Rápida"
            description="Processa PDFs de até 50MB em minutos usando IA avançada"
          />
          <FeatureCard
            icon={<Sparkles className="h-5 w-5" />}
            title="IA Reasoning"
            description="Utiliza DeepSeek R1 com capacidade de raciocínio profundo"
          />
          <FeatureCard
            icon={<Database className="h-5 w-5" />}
            title="Real-time"
            description="Acompanhe o progresso da análise em tempo real"
          />
          <FeatureCard
            icon={<BarChart3 className="h-5 w-5" />}
            title="4 Fases"
            description="Análise completa em múltiplas etapas especializadas"
          />
          <FeatureCard
            icon={<Shield className="h-5 w-5" />}
            title="Conformidade"
            description="Verifica aspectos legais e técnicos automaticamente"
          />
          <FeatureCard
            icon={<Leaf className="h-5 w-5" />}
            title="Impacto Ambiental"
            description="Avalia impactos e medidas mitigadoras"
          />
        </div>
      </div>

      <Separator />

      {/* How it Works */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Como Funciona</h2>
        <div className="space-y-4">
          <ProcessStep
            number={1}
            title="Upload do PDF"
            description="Arraste e solte ou selecione um arquivo PDF do EIA (até 50MB)"
          />
          <ProcessStep
            number={2}
            title="Leitura Profunda"
            description="O sistema extrai e analisa o conteúdo completo do documento"
          />
          <ProcessStep
            number={3}
            title="Análise Especializada"
            description="4 análises paralelas: Legal, Técnica, Impactos e Mitigação"
          />
          <ProcessStep
            number={4}
            title="Verificação Cruzada"
            description="Validação entre as diferentes análises para garantir consistência"
          />
          <ProcessStep
            number={5}
            title="Relatório Final"
            description="Consolidação com notas, classificações e recomendações detalhadas"
          />
        </div>
      </div>

      <Separator />

      {/* Tech Stack */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Tecnologias</h2>
        <Card>
          <CardHeader>
            <CardTitle>Stack Tecnológico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="mb-2 font-semibold">Frontend</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">React 19</Badge>
                <Badge variant="secondary">Vite</Badge>
                <Badge variant="secondary">TanStack Router</Badge>
                <Badge variant="secondary">Tailwind CSS v4</Badge>
                <Badge variant="secondary">shadcn/ui</Badge>
              </div>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Backend</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Bun Runtime</Badge>
                <Badge variant="secondary">Express</Badge>
                <Badge variant="secondary">Convex</Badge>
                <Badge variant="secondary">TypeScript</Badge>
              </div>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Inteligência Artificial</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">DeepSeek R1</Badge>
                <Badge variant="secondary">Extended Thinking</Badge>
                <Badge variant="secondary">Multi-provider</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Info */}
      <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
        <CardContent className="pt-6">
          <p className="text-center text-sm text-muted-foreground">
            Desenvolvido com ❤️ usando Bun + React + Convex + DeepSeek AI
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            {icon}
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function ProcessStep({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {number}
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
