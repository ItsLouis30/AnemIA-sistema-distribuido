import { motion } from 'framer-motion'
import { Pill } from 'lucide-react'

import type { Recommendation } from '../../types'

interface Props {
  recommendation: Recommendation
  diagnosisLabel?: string
}

export default function RecommendationBubble({ recommendation, diagnosisLabel }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay: 0.15 }}
      className="rounded-2xl border border-emerald-200 bg-white shadow-sm overflow-hidden"
      role="region"
      aria-label="Recomendación terapéutica"
    >
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-emerald-100">
        <Pill size={15} className="text-emerald-600" aria-hidden="true" />
        <span className="text-xs font-medium text-slate-700">Agente 5 · Terapéutico — Recomendación</span>
      </div>

      <div className="p-3 space-y-2">
        {diagnosisLabel && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1.5">
            <p className="text-[11px] text-emerald-700 font-medium">{diagnosisLabel}</p>
          </div>
        )}

        <p className="text-sm font-semibold text-slate-700">{recommendation.title}</p>

        {recommendation.items?.length > 0 && (
          <ul className="space-y-1.5">
            {recommendation.items.map((item, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                <span className="mt-1.5 flex h-1 w-1 flex-shrink-0 rounded-full bg-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
        )}

        <div className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1.5">
          <p className="text-[10px] text-slate-500">
            <strong>Fuente:</strong> {recommendation.source || 'MINSA - Guías CRED'}
          </p>
        </div>

        <div className="rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5">
          <p className="text-[10px] text-amber-700">
            ⚠ Recomendación referencial generada por prototipo académico.
          </p>
        </div>
      </div>
    </motion.div>
  )
}
