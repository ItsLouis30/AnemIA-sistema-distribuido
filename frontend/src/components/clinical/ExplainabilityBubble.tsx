import { motion } from 'framer-motion'
import { Lightbulb } from 'lucide-react'

import type { ExplanationResult, ShapResult, XaiFactor } from '../../types'

interface Props {
  shap: ShapResult | null
  lime: ExplanationResult | null
}

export default function ExplainabilityBubble({ shap, lime }: Props) {
  const globalFactors = shap?.global || []
  const localFactors = shap?.local?.factors || lime?.factors || []
  const factors = globalFactors.length > 0 ? globalFactors : localFactors

  if (!factors.length) return null

  const maxVal = Math.max(...factors.map(f => f.weight_norm || 0), 0.01)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
      className="rounded-2xl border border-blue-200 bg-white shadow-sm overflow-hidden"
      role="region"
      aria-label="Explicabilidad del modelo"
    >
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-blue-100">
        <Lightbulb size={15} className="text-blue-600" aria-hidden="true" />
        <span className="text-xs font-medium text-slate-700">Agente 4 · Explicabilidad — Factores influyentes</span>
      </div>

      <div className="p-3 space-y-3">
        <div className="flex items-center gap-4 mb-2 text-[10px]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-red-400" />
            Anemia
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-blue-400" />
            Sin anemia
          </span>
        </div>

        <div className="space-y-2">
          {factors.slice(0, 6).map((f, i) => {
            const anemiaPct = Math.max(2, (f.weight_norm / maxVal) * 100)
            const normalPct = Math.max(2, ((1 - f.weight_norm) / maxVal) * 100)
            return (
              <div key={f.feature} className="flex items-center gap-2">
                <span className="text-xs text-slate-700 min-w-[120px] text-right leading-tight">{f.label}</span>
                <div className="flex-1 space-y-0.5">
                  <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(anemiaPct, 100)}%` }}
                      transition={{ duration: 0.6, delay: 0.1 + i * 0.08 }}
                      className="h-full rounded-full bg-red-400"
                    />
                  </div>
                  <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(normalPct, 100)}%` }}
                      transition={{ duration: 0.6, delay: 0.15 + i * 0.08 }}
                      className="h-full rounded-full bg-blue-400"
                    />
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-slate-600 min-w-[32px] text-left">
                  {f.weight_norm.toFixed(2)}
                </span>
              </div>
            )
          })}
        </div>

        <p className="text-[10px] italic text-slate-400 leading-relaxed">
          Barras rojas = contribución al diagnóstico de anemia. Barras azules = contribución a un resultado normal. SHAP/LIME normalizado.
        </p>
      </div>
    </motion.div>
  )
}
