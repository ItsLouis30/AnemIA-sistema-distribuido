import { LayoutGroup, motion, useReducedMotion } from 'framer-motion'
import {
  Activity, ArrowLeft, Cpu, Download, FileText, Lightbulb, Pill, Printer, Stethoscope,
} from 'lucide-react'
import { useState } from 'react'

import { useClinicalPdf } from '../../hooks/useClinicalPdf'
import type { AgentDescriptor, AgentRunReport, XaiFactor } from '../../types'
import AgentStatusItem from '../agents/AgentStatusItem'

type TabId = 'summary' | 'xai' | 'agents' | 'recommendation' | 'pdf'

interface Props {
  report: AgentRunReport | null
  agents: AgentDescriptor[]
  /** Si se provee, muestra un botón «volver» en la cabecera (modo pantalla completa). */
  onBack?: () => void
}

const TABS: Array<{ id: TabId; label: string; icon: typeof Stethoscope }> = [
  { id: 'summary', label: 'Resumen', icon: Stethoscope },
  { id: 'xai', label: 'XAI', icon: Lightbulb },
  { id: 'agents', label: 'Agentes', icon: Cpu },
  { id: 'recommendation', label: 'Plan', icon: Pill },
  { id: 'pdf', label: 'PDF', icon: FileText },
]

export default function ClinicalResultPanel({ report, agents, onBack }: Props) {
  const [tab, setTab] = useState<TabId>('summary')
  const reduce = useReducedMotion()

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver al chat"
            className="-ml-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <ArrowLeft size={17} />
          </button>
        )}
        <Activity size={15} className="text-teal-600" />
        <h2 className="text-sm font-semibold text-slate-700">Resultados clínicos</h2>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="ml-auto rounded-lg px-2.5 py-1 text-xs font-medium text-teal-700 transition hover:bg-teal-50"
          >
            Volver al chat
          </button>
        )}
      </div>

      {/* Pestañas con indicador animado compartido */}
      <LayoutGroup>
        <div className="flex gap-0.5 border-b border-slate-200 px-2 py-2" role="tablist">
          {TABS.map((t) => {
            const active = t.id === tab
            const Icon = t.icon
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-medium transition ${
                  active ? 'text-teal-700' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="panel-tab"
                    className="absolute inset-0 rounded-lg bg-teal-50"
                    transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 34 }}
                  />
                )}
                <Icon size={15} className="relative z-10" />
                <span className="relative z-10">{t.label}</span>
              </button>
            )
          })}
        </div>
      </LayoutGroup>

      <div className="flex-1 overflow-y-auto p-4">
        {!report?.ok ? (
          <EmptyState />
        ) : (
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: reduce ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
          >
            {tab === 'summary' && <SummaryTab report={report} />}
            {tab === 'xai' && <XaiTab report={report} />}
            {tab === 'agents' && <AgentsTab report={report} agents={agents} />}
            {tab === 'recommendation' && <RecommendationTab report={report} />}
            {tab === 'pdf' && <PdfTab report={report} />}
          </motion.div>
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Stethoscope size={22} />
      </div>
      <p className="text-xs font-medium text-slate-500">Aún no hay resultados</p>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
        Registra un caso clínico y analízalo con los agentes para ver aquí el diagnóstico,
        la explicabilidad y las recomendaciones.
      </p>
    </div>
  )
}

const badgeClass: Record<string, string> = {
  Normal: 'bg-green-100 text-green-700',
  AnemiaLeve: 'bg-amber-100 text-amber-700',
  AnemiaModerada: 'bg-orange-100 text-orange-700',
  AnemiaSevera: 'bg-red-100 text-red-700',
}

function SummaryTab({ report }: { report: AgentRunReport }) {
  const pred = report.prediction
  const pre = report.preprocessing
  if (!pred) return null
  return (
    <div className="space-y-4">
      <div className={`rounded-xl px-4 py-3 ${badgeClass[pred.diagnosis_code] || 'bg-slate-100 text-slate-700'}`}>
        <p className="text-[10px] uppercase tracking-wide opacity-70">Diagnóstico estimado</p>
        <p className="text-lg font-bold">{pred.diagnosis_label}</p>
        <p className="text-xs opacity-80">Confianza {pred.probability}% · {pred.model}</p>
      </div>

      {pre && (
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Hb observada" value={`${pre.hb_observed}`} unit="g/dL" />
          <Stat label="Ajuste" value={`${pre.adjustment}`} unit="g/dL" />
          <Stat label="Hbc" value={`${pre.hbc}`} unit="g/dL" highlight />
        </div>
      )}

      {pred.class_probabilities && (
        <div>
          <p className="mb-2 text-[11px] font-semibold text-slate-500">Probabilidades por clase</p>
          <div className="space-y-1.5">
            {Object.entries(pred.class_probabilities).map(([cls, prob]) => (
              <Bar key={cls} label={cls} fraction={prob} text={`${(prob * 100).toFixed(1)}%`} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, unit, highlight }: { label: string; value: string; unit: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-2 text-center ${highlight ? 'border-teal-200 bg-teal-50' : 'border-slate-200 bg-slate-50'}`}>
      <p className="text-[9px] text-slate-500">{label}</p>
      <p className={`text-base font-bold ${highlight ? 'text-teal-700' : 'text-slate-700'}`}>{value}</p>
      <p className="text-[9px] text-slate-400">{unit}</p>
    </div>
  )
}

function Bar({ label, fraction, text }: { label: string; fraction: number; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 flex-shrink-0 truncate text-[10px] text-slate-600">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(fraction * 100, 100)}%` }}
          transition={{ duration: 0.5 }}
          className="h-full rounded-full bg-teal-500"
        />
      </div>
      <span className="w-10 flex-shrink-0 text-right text-[10px] font-semibold text-slate-600">{text}</span>
    </div>
  )
}

function getFactors(report: AgentRunReport): XaiFactor[] {
  const ex = report.explainability
  if (!ex) return []
  const global = ex.shap?.global ?? []
  const local = ex.shap?.local?.factors ?? ex.lime?.factors ?? []
  return (global.length ? global : local).slice(0, 6)
}

function XaiTab({ report }: { report: AgentRunReport }) {
  const factors = getFactors(report)
  if (!factors.length) return <p className="text-xs text-slate-400">Sin datos de explicabilidad.</p>
  const max = Math.max(...factors.map((f) => f.weight_norm || 0), 0.01)
  return (
    <div className="space-y-3">
      {report.explainability?.top_factor && (
        <div className="rounded-xl bg-blue-50 px-3 py-2 text-[11px] text-blue-800">
          <span className="font-semibold">Factor principal:</span> {report.explainability.top_factor}
        </div>
      )}
      <div className="space-y-2">
        {factors.map((f, i) => (
          <div key={f.feature}>
            <div className="mb-0.5 flex items-center justify-between">
              <span className="text-[11px] text-slate-600">{f.label}</span>
              <span className="text-[10px] font-semibold text-slate-500">{f.weight_norm.toFixed(2)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((f.weight_norm / max) * 100, 100)}%` }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="h-full rounded-full bg-blue-400"
              />
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] italic leading-relaxed text-slate-400">
        Importancia relativa de cada factor en la predicción (SHAP/LIME normalizado).
      </p>
    </div>
  )
}

function AgentsTab({ report, agents }: { report: AgentRunReport; agents: AgentDescriptor[] }) {
  const mon = report.monitoring
  return (
    <div className="space-y-3">
      <div role="list" className="space-y-0.5">
        {agents.map((a, i) => (
          <AgentStatusItem key={a.id} index={i} name={a.name} description={a.description} status={a.status} detail={a.detail} />
        ))}
      </div>
      {mon && (
        <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
          <Stat label="Agentes" value={String(report.agent_logs?.length ?? mon.agents_run)} unit="ejecutados" />
          <Stat label="Tiempo total" value={String(mon.total_elapsed_ms)} unit="ms" />
          <Stat label="Errores" value={String(mon.errors)} unit="" />
          <Stat label="Estado" value={mon.status} unit="" />
        </div>
      )}
    </div>
  )
}

function RecommendationTab({ report }: { report: AgentRunReport }) {
  const rec = report.recommendation
  if (!rec) return <p className="text-xs text-slate-400">Sin recomendaciones disponibles.</p>
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-800">{rec.title}</p>
      <ul className="space-y-2">
        {rec.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />
            {item}
          </li>
        ))}
      </ul>
      {rec.source && <p className="border-t border-slate-100 pt-2 text-[10px] text-slate-400">Fuente: {rec.source}</p>}
    </div>
  )
}

function PdfTab({ report }: { report: AgentRunReport }) {
  const { generating, error, downloadPdf, printPdf } = useClinicalPdf()
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="mb-1 flex items-center gap-2">
          <FileText size={15} className="text-teal-600" />
          <p className="text-xs font-semibold text-slate-700">Reporte clínico en PDF</p>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500">
          Documento A4 vectorial con encabezado institucional, datos del paciente, hemoglobina
          corregida, resultado ML, explicabilidad, recomendaciones y numeración de páginas.
        </p>
      </div>
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[11px] text-red-700" role="alert">{error}</div>
      )}
      <button onClick={() => downloadPdf(report)} disabled={generating} className="btn-primary w-full text-xs py-2.5">
        <Download size={14} /> {generating ? 'Generando…' : 'Descargar PDF'}
      </button>
      <button onClick={() => printPdf(report)} disabled={generating} className="btn-ghost w-full text-xs py-2">
        <Printer size={14} /> Imprimir
      </button>
    </div>
  )
}
