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

import { shortLabel } from './labels'

interface Props {
  distribution: {
    raw_train: Record<string, number>
    after_smote: Record<string, number>
  }
  classes: string[]
}

/**
 * Barras agrupadas del nº de muestras por clase en entrenamiento, ANTES
 * («Original») y DESPUÉS de aplicar SMOTE. Hace visible el fuerte desbalance
 * del dataset (la clase Normal domina; la Severa es minúscula) y cómo SMOTE
 * iguala todas las clases a la mayoritaria. Es una vista de calidad de datos,
 * independiente de la hemoglobina.
 */
export default function ClassBalanceChart({ distribution, classes }: Props) {
  const data = classes.map((c) => ({
    name: shortLabel(c),
    Original: distribution.raw_train[c] ?? 0,
    'Con SMOTE': distribution.after_smote[c] ?? 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} width={48} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
          formatter={(v: number) => v.toLocaleString('es-PE')}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="Original" fill="#94a3b8" radius={[3, 3, 0, 0]} />
        <Bar dataKey="Con SMOTE" fill="#0d9488" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
