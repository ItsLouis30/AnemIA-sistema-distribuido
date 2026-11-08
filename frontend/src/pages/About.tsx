import { motion } from 'framer-motion'
import {
  BookOpen,
  Brain,
  Github,
  HeartPulse,
  Lightbulb,
  Mountain,
  Pill,
  Users,
} from 'lucide-react'

import AnimatedCard from '../components/AnimatedCard'
import { pageTransition } from '../pageTransition'

const features = [
  { icon: Mountain, title: 'Corrección por altitud', desc: 'Hbc ajustada (OMS 2024 / MINSA).' },
  { icon: Brain, title: 'Diagnóstico ML', desc: 'Random Forest y XGBoost multiclase.' },
  { icon: Lightbulb, title: 'Explicabilidad XAI', desc: 'SHAP y LIME por caso.' },
  { icon: Pill, title: 'Recomendación MINSA', desc: 'Pautas referenciales CRED.' },
]

export default function About() {
  return (
    <motion.div {...pageTransition} className="min-h-screen">
      <div className="mx-auto max-w-lg px-4 py-6 space-y-4 lg:max-w-4xl">
        <AnimatedCard className="bg-gradient-to-br from-teal-600 to-teal-800 text-white border-0">
          <h2 className="text-xl font-bold">Asistente clínico para anemia infantil</h2>
          <p className="mt-1 text-sm text-teal-100">
            Sistema multiagente con Machine Learning y XAI para la región altoandina de
            Puno, Perú, donde la altitud distorsiona la interpretación de la hemoglobina.
          </p>
        </AnimatedCard>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <AnimatedCard key={title} delay={0.05 * i} hoverable>
              <Icon size={22} className="text-teal-600" />
              <p className="mt-2 text-sm font-semibold text-slate-700">{title}</p>
              <p className="text-[11px] text-slate-400">{desc}</p>
            </AnimatedCard>
          ))}
        </div>

        <AnimatedCard delay={0.3}>
          <p className="text-sm font-semibold text-slate-700">Pipeline de 6 agentes</p>
          <ol className="mt-2 space-y-1 text-xs text-slate-500">
            <li>1 · Registro Clínico → valida los datos del caso.</li>
            <li>2 · Clínico-Contextual → calcula la Hbc por altitud.</li>
            <li>3 · Predictivo ML → estima la severidad de la anemia.</li>
            <li>4 · Explicabilidad → genera SHAP / LIME.</li>
            <li>5 · Terapéutico → recomienda según MINSA.</li>
            <li>6 · Coordinador → consolida y audita el reporte.</li>
          </ol>
        </AnimatedCard>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
              <HeartPulse size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">AnemIA v2.0</p>
              <p className="text-[11px] text-slate-400">Sistema Multiagente · Anemia Infantil</p>
            </div>
          </div>

          <div className="space-y-2">
            <Feature icon={BookOpen} title="Tecnologías">
              React · TypeScript · Webpack 5 · Tailwind CSS · FastAPI · PostgreSQL · Docker
            </Feature>
            <Feature icon={Users} title="Equipo">
              Proyecto académico universitario · Ciclo VII · Ingeniería de Sistemas
            </Feature>
            <Feature icon={Github} title="Repositorio">
              Código fuente disponible para fines académicos y de investigación.
            </Feature>
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-700">
            <strong>Aviso:</strong> Este sistema es un prototipo académico y no debe
            utilizarse como único recurso para diagnóstico médico. Siempre consulte a un
            profesional de salud calificado.
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function Feature({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="mt-0.5 text-teal-600 flex-shrink-0" />
      <div>
        <p className="text-xs font-semibold text-slate-700">{title}</p>
        <p className="text-xs text-slate-500">{children}</p>
      </div>
    </div>
  )
}
