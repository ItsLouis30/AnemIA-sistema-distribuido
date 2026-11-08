import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

import type { MetricBlock, ModelStatus } from '../../types'

const MODEL_LABEL: Record<string, string> = {
  random_forest: 'Random Forest',
  xgboost: 'XGBoost',
}

const MODEL_COLOR: Record<string, string> = {
  random_forest: '#0d9488', // teal
  xgboost: '#7c3aed', // violeta
}

// Métricas 0-1 comparables en un radar (todas «más alto = mejor»).
const METRICS: { key: keyof MetricBlock; label: string }[] = [
  { key: 'accuracy', label: 'Accuracy' },
  { key: 'balanced_accuracy', label: 'Bal. acc' },
  { key: 'f1_macro', label: 'F1 macro' },
  { key: 'roc_auc_macro_ovr', label: 'ROC-AUC' },
  { key: 'mcc', label: 'MCC' },
  { key: 'cohen_kappa', label: 'Kappa' },
]

interface Props {
  models: ModelStatus[]
}

/**
 * Radar comparativo de los modelos sobre el conjunto de PRUEBA. Superpone una
 * silueta por modelo en los mismos ejes (accuracy, balanced acc, F1, ROC-AUC,
 * MCC, Kappa), de modo que «cuál usar» se lee de un vistazo: el polígono más
 * externo domina. Solo se dibuja si hay ≥2 modelos entrenados con métricas.
 */
export default function ModelComparisonRadar({ models }: Props) {
  const trained = models.filter((m) => m.trained && m.metrics?.test)
  if (trained.length < 2) return null

  const data = METRICS.map(({ key, label }) => {
    const row: Record<string, number | string> = { metric: label }
    for (const m of trained) {
      const value = m.metrics!.test[key] as number | null
      row[m.name] = value ?? 0
    }
    return row
  })

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#64748b' }} />
        <PolarRadiusAxis
          domain={[0, 1]}
          angle={90}
          tick={{ fontSize: 9, fill: '#94a3b8' }}
          tickCount={5}
        />
        {trained.map((m) => (
          <Radar
            key={m.name}
            name={MODEL_LABEL[m.name] ?? m.name}
            dataKey={m.name}
            stroke={MODEL_COLOR[m.name] ?? '#64748b'}
            fill={MODEL_COLOR[m.name] ?? '#64748b'}
            fillOpacity={0.18}
            strokeWidth={2}
          />
        ))}
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
          formatter={(v: number) => v.toFixed(3)}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
