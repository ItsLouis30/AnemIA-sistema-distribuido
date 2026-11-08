import { motion } from 'framer-motion'
import { Brain, CheckCircle2 } from 'lucide-react'

import { diagnosisColors } from '../../mocks/exampleCase'
import type { AgentRunReport } from '../../types'

interface Props {
  report: AgentRunReport
}

export default function PredictionResultBubble({ report }: Props) {
  const pre = report.preprocessing
  const pred = report.prediction
  if (!pre || !pred) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-800"
      role="region"
      aria-label="Resultado de predicción"
    >
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5 dark:border-white/10">
        <Brain size={15} className="text-teal-600 dark:text-teal-400" aria-hidden="true" />
        <span className="text-xs font-medium text-slate-700 dark:text-slate-200">Agente 3 · Predictivo — Resultado</span>
      </div>

      <div className="p-3 space-y-3">
        <div className="grid grid-cols-3 gap-1.5">
          <Metric label="Hb observada" value={`${pre.hb_observed}`} />
          <Metric label="Ajuste" value={`${pre.adjustment > 0 ? '+' : ''}${pre.adjustment}`} highlight />
          <Metric label="Hb corregida" value={`${pre.hbc}`} highlight />
        </div>

        <div
          className="rounded-xl p-3 text-center text-white"
          style={{ background: diagnosisColors[pred.diagnosis_code] || '#0d9488' }}
        >
          <p className="text-[10px] opacity-90">Diagnóstico estimado ({pred.model})</p>
          <p className="mt-0.5 text-xl font-bold">{pred.diagnosis_label}</p>
          <p className="mt-0.5 text-xs opacity-90">
            Confianza: <span className="font-data font-semibold">{pred.probability}%</span>
          </p>
        </div>

        {pred.class_probabilities && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Probabilidades por clase</p>
            {Object.entries(pred.class_probabilities).map(([cls, prob]) => (
              <div key={cls} className="flex items-center gap-1.5">
                <span className="w-24 truncate text-[10px] text-slate-600 dark:text-slate-300">{cls}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(prob * 100).toFixed(1)}%` }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="h-full rounded-full bg-teal-500"
                  />
                </div>
                <span className="font-data w-8 text-right text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                  {(prob * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        )}

        {report.monitoring && (
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-[10px] text-slate-500 dark:bg-white/5 dark:text-slate-400">
            <span>Pipeline completado</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={11} className="text-teal-600 dark:text-teal-400" />
              <span className="font-data">{report.monitoring.total_elapsed_ms} ms</span>
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-lg border p-1.5 text-center ${highlight ? 'border-teal-200 bg-teal-50 dark:border-teal-400/30 dark:bg-teal-500/10' : 'border-slate-200 dark:border-white/10'}`}>
      <span className={`font-data text-sm font-bold ${highlight ? 'text-teal-700 dark:text-teal-300' : 'text-slate-700 dark:text-slate-200'}`}>{value}</span>
      <span className="mt-0.5 text-[9px] text-slate-400 dark:text-slate-500">{label}</span>
    </div>
  )
}
