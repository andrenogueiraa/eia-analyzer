import { createFileRoute } from "@tanstack/react-router";
import {
  Leaf,
  Scale,
  GitMerge,
  FileCheck,
  Brain,
  Users,
  CheckCircle,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-green-500/10">
            <Leaf className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Metodologia de Análise
            </h1>
            <p className="text-muted-foreground">
              Como os agentes de IA analisam Estudos de Impacto Ambiental
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Overview */}
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <p className="text-lg leading-relaxed text-muted-foreground">
          O EIAnálise utiliza uma metodologia de{" "}
          <strong>análise em 4 fases</strong> com{" "}
          <strong>agentes especializados</strong> que trabalham de forma
          coordenada para avaliar rigorosamente cada aspecto de um Estudo de
          Impacto Ambiental (EIA), seguindo as normativas da{" "}
          <strong>Resolução CONAMA 001/86</strong> e <strong>237/97</strong>.
        </p>
      </div>

      {/* Phases Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <PhaseOverviewCard phase={1} title="Leitura Profunda" icon={BookOpen} />
        <PhaseOverviewCard
          phase={2}
          title="Análise Especializada"
          icon={Users}
        />
        <PhaseOverviewCard
          phase={3}
          title="Verificação Cruzada"
          icon={GitMerge}
        />
        <PhaseOverviewCard phase={4} title="Consolidação" icon={FileCheck} />
      </div>

      <Separator />

      {/* Phase 1 */}
      <PhaseSection
        phase={1}
        title="Leitura Profunda e Contextualização"
        description="O primeiro agente realiza uma leitura completa do documento para criar um mapa mental estruturado do EIA."
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Esta fase é fundamental para que os agentes especializados tenham
            contexto adequado. O agente identifica:
          </p>
          <ul className="space-y-2">
            <CheckItem>
              <strong>Estrutura do documento</strong> - Todas as seções e
              subseções presentes
            </CheckItem>
            <CheckItem>
              <strong>Mapa de relações</strong> - Como diferentes partes se
              conectam e fazem referência cruzada
            </CheckItem>
            <CheckItem>
              <strong>Áreas críticas</strong> - Seções que precisam de atenção
              especial na análise
            </CheckItem>
            <CheckItem>
              <strong>Contexto geral</strong> - Tipo de empreendimento,
              localização e principais impactos declarados
            </CheckItem>
          </ul>
        </div>
      </PhaseSection>

      <Separator />

      {/* Phase 2 - Specialized Agents */}
      <PhaseSection
        phase={2}
        title="Análises Especializadas por Domínio"
        description="Quatro agentes especializados analisam o EIA em paralelo, cada um focando em sua área de expertise."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {/* Legal Agent */}
          <AgentCard
            title="Agente Jurídico Ambiental"
            color="blue"
            checks={[
              "Conformidade com CONAMA 001/86 e 237/97",
              "Requisitos legais obrigatórios",
              "Referências legais e processos administrativos",
              "Estrutura regulatória exigida",
            ]}
          />

          {/* Technical Agent */}
          <AgentCard
            title="Agente Técnico Científico"
            color="purple"
            checks={[
              "Metodologias científicas utilizadas",
              "Qualidade de amostragem e coleta de dados",
              "Análises estatísticas e cálculos",
              "Mapas e representações cartográficas",
            ]}
          />

          {/* Impacts Agent */}
          <AgentCard
            title="Agente Avaliador de Impactos"
            color="orange"
            checks={[
              "Identificação de impactos diretos e indiretos",
              "Avaliação de magnitude e significância",
              "Impactos por fase (implantação, operação)",
              "Impactos cumulativos e sinérgicos",
            ]}
          />

          {/* Mitigation Agent */}
          <AgentCard
            title="Agente de Medidas Mitigadoras"
            color="green"
            checks={[
              "Correspondência impacto-medida",
              "Viabilidade técnica das medidas",
              "Programas ambientais estruturados",
              "Indicadores de monitoramento",
            ]}
          />
        </div>

        <Card className="mt-4 border-dashed">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">
              <strong>Nota:</strong> Os agentes utilizam marcadores padronizados
              para classificar suas descobertas:
            </p>
            <div className="flex flex-wrap gap-4 mt-2">
              <Badge variant="default" className="gap-1">
                ✅ Pontos conformes
              </Badge>
              <Badge variant="secondary" className="gap-1">
                ⚠️ Alertas
              </Badge>
              <Badge variant="destructive" className="gap-1">
                ❌ Não-conformidades graves
              </Badge>
            </div>
          </CardContent>
        </Card>
      </PhaseSection>

      <Separator />

      {/* Phase 3 */}
      <PhaseSection
        phase={3}
        title="Verificação Cruzada e Validação"
        description="Um revisor sênior compara todas as análises, buscando inconsistências e validando conclusões."
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Esta fase crítica garante a consistência e completude da análise. O
            revisor busca:
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <ValidationItem
              title="Inconsistências"
              description="Um domínio identificou problema que outro ignorou? Conclusões contraditórias?"
            />
            <ValidationItem
              title="Validação"
              description="As críticas estão bem fundamentadas? Há exageros ou subestimações?"
            />
            <ValidationItem
              title="Lacunas"
              description="Aspectos importantes que nenhum agente analisou? Problemas sistêmicos?"
            />
            <ValidationItem
              title="Reanálise"
              description="Quais conclusões precisam ser revisadas? Onde falta aprofundamento?"
            />
          </div>
        </div>
      </PhaseSection>

      <Separator />

      {/* Phase 4 */}
      <PhaseSection
        phase={4}
        title="Consolidação e Relatório Final"
        description="O coordenador final gera um relatório consolidado com todas as descobertas e recomendações."
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            O relatório final é estruturado para uso direto pelo analista
            humano:
          </p>
          <div className="space-y-3">
            <ReportSection
              number={1}
              title="Síntese Executiva"
              description="Resumo geral do EIA, qualidade e principal conclusão"
            />
            <ReportSection
              number={2}
              title="Problemas Críticos"
              description="Problemas graves priorizados por gravidade, com fundamentação legal/técnica"
            />
            <ReportSection
              number={3}
              title="Alertas e Recomendações"
              description="Problemas menores, sugestões de melhoria e documentação adicional necessária"
            />
            <ReportSection
              number={4}
              title="Aspectos Positivos"
              description="Pontos fortes do estudo e conformidades importantes"
            />
            <ReportSection
              number={5}
              title="Parecer Final"
              description="Recomendação fundamentada: Aprovação / Condicionada / Complementação / Rejeição"
            />
          </div>
        </div>
      </PhaseSection>

      <Separator />

      {/* Extended Thinking */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Extended Thinking (Reasoning)
          </CardTitle>
          <CardDescription>
            Capacidade de raciocínio profundo disponível em modelos selecionados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Quando disponível, os agentes utilizam{" "}
            <strong>Extended Thinking</strong>, uma capacidade que permite ao
            modelo "pensar" antes de responder, similar ao raciocínio humano.
            Isso resulta em:
          </p>
          <ul className="space-y-2">
            <CheckItem>Análises mais profundas e bem fundamentadas</CheckItem>
            <CheckItem>
              Identificação de problemas sutis que passariam despercebidos
            </CheckItem>
            <CheckItem>
              Conexões mais elaboradas entre diferentes partes do documento
            </CheckItem>
            <CheckItem>
              Recomendações mais precisas e contextualizadas
            </CheckItem>
          </ul>
          <p className="text-sm text-muted-foreground">
            O "thinking budget" pode ser ajustado por fase, dedicando mais
            tokens de raciocínio às fases mais críticas da análise.
          </p>
        </CardContent>
      </Card>

      {/* Legal References */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5" />
            Base Legal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium">Resolução CONAMA 001/86</p>
              <p className="text-muted-foreground">
                Estabelece critérios básicos e diretrizes gerais para uso e
                implementação da Avaliação de Impacto Ambiental (AIA) no Brasil.
              </p>
            </div>
            <Separator />
            <div>
              <p className="font-medium">Resolução CONAMA 237/97</p>
              <p className="text-muted-foreground">
                Regulamenta os aspectos de licenciamento ambiental estabelecidos
                na Política Nacional do Meio Ambiente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
        <CardContent className="pt-6">
          <p className="text-sm text-center text-muted-foreground">
            A análise automatizada é uma ferramenta de apoio. A decisão final
            deve sempre ser tomada por profissionais qualificados com base em
            sua expertise técnica.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function PhaseOverviewCard({
  phase,
  title,
  icon: Icon,
}: {
  phase: number;
  title: string;
  icon: typeof BookOpen;
}) {
  return (
    <Card className="text-center">
      <CardContent className="pt-4">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 text-lg font-bold rounded-full bg-primary text-primary-foreground">
            {phase}
          </div>
          <Icon className="w-5 h-5 text-muted-foreground" />
          <p className="text-sm font-medium">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function PhaseSection({
  phase,
  title,
  description,
  children,
}: {
  phase: number;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center w-12 h-12 text-xl font-bold rounded-full shrink-0 bg-primary text-primary-foreground">
          {phase}
        </div>
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">{title}</h2>
          <p className="mt-1 text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="ml-16">{children}</div>
    </div>
  );
}

function AgentCard({
  title,
  color,
  checks,
}: {
  title: string;
  color: "blue" | "purple" | "orange" | "green";
  checks: string[];
}) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900",
    purple:
      "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-900",
    orange:
      "bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-900",
    green:
      "bg-green-500/10 text-green-600 border-green-200 dark:border-green-900",
  };

  return (
    <Card className={colorClasses[color]}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1 text-sm">
          {checks.map((check, i) => (
            <li key={i} className="flex items-start gap-2">
              <ArrowRight className="h-3 w-3 mt-1.5 shrink-0" />
              <span>{check}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle className="w-4 h-4 mt-1 text-green-500 shrink-0" />
      <span>{children}</span>
    </li>
  );
}

function ValidationItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-3 border rounded-lg">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function ReportSection({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full shrink-0 bg-muted">
        {number}
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
