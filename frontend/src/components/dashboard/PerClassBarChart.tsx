import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { PerClassMetric } from '../../types'
import { shortLabel } from './labels'

interface Props {
  perClass: Record<string, PerClassMetric>
  classes: string[]
}

/** Barras agrupadas de Precisión / Recall / F1 por clase. */
export default function PerClassBarChart({ perClass, classes }: Props) {
  const data = classes
    .filter((c) => perClass[c])
    .map((c) => ({
      name: shortLabel(c),
      Precisión: perClass[c].precision,
      Recall: perClass[c].recall,
      F1: perClass[c].f1,
    }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
        <YAxis domain={[0, 1]} tick={{ fontSize: 11, fill: '#64748b' }} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
          formatter={(v: number) => v.toFixed(3)}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="Precisión" fill="#2563eb" radius={[3, 3, 0, 0]} />
        <Bar dataKey="Recall" fill="#16a34a" radius={[3, 3, 0, 0]} />
        <Bar dataKey="F1" fill="#d97706" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
