import { createFileRoute } from '@tanstack/react-router'
import { Leaf, Zap, Shield, TrendingUp } from 'lucide-react'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Sobre o EIA Analyzer
      </h1>
      <p className="text-xl text-gray-600 mb-12">
        Análise automatizada de Estudos de Impacto Ambiental usando IA
      </p>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <FeatureCard
          icon={<Zap className="h-8 w-8" />}
          title="Análise Rápida"
          description="Análise completa em 3-4 minutos. 4 fases especializadas com reasoning profundo."
        />
        <FeatureCard
          icon={<Shield className="h-8 w-8" />}
          title="Alta Qualidade"
          description="DeepSeek R1 com reasoning nativo. Identifica problemas críticos e inconsistências."
        />
        <FeatureCard
          icon={<TrendingUp className="h-8 w-8" />}
          title="Custo Baixo"
          description="~$5-8 por análise de 100 páginas. 10x mais barato que alternativas."
        />
        <FeatureCard
          icon={<Leaf className="h-8 w-8" />}
          title="Especializado"
          description="4 agentes especializados: Legal, Técnico, Impactos e Mitigação."
        />
      </div>

      {/* Tech Stack */}
      <div className="bg-white rounded-lg border p-8 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Tecnologias
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <TechItem name="Frontend" tech="React 19 + TanStack Router" />
          <TechItem name="Backend" tech="Convex (serverless)" />
          <TechItem name="IA" tech="DeepSeek R1 (reasoning)" />
          <TechItem name="Styling" tech="Tailwind CSS" />
          <TechItem name="Runtime" tech="Bun" />
          <TechItem name="Database" tech="Convex (real-time)" />
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Como Funciona
        </h2>
        <ol className="space-y-4">
          <Step
            number={1}
            title="Upload"
            description="Faça upload do PDF do EIA. Armazenado de forma segura no Convex."
          />
          <Step
            number={2}
            title="Fase 1: Leitura Profunda"
            description="IA lê documento completo, mapeia estrutura e identifica áreas críticas."
          />
          <Step
            number={3}
            title="Fase 2: Análises Especializadas"
            description="4 agentes analisam em paralelo: Legal, Técnico, Impactos e Mitigação."
          />
          <Step
            number={4}
            title="Fase 3: Verificação Cruzada"
            description="Valida consistência, detecta contradições e identifica lacunas."
          />
          <Step
            number={5}
            title="Fase 4: Consolidação"
            description="Gera relatório técnico completo com problemas priorizados."
          />
        </ol>
      </div>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="text-green-600 mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function TechItem({ name, tech }: { name: string; tech: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-gray-600">{name}</span>
      <span className="font-medium text-gray-900">{tech}</span>
    </div>
  )
}

function Step({
  number,
  title,
  description,
}: {
  number: number
  title: string
  description: string
}) {
  return (
    <li className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </li>
  )
}
