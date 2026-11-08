import type { ReactNode } from 'react'

import AnimatedCard from './AnimatedCard'

interface Props {
  title: string
  value: ReactNode
  subtitle?: string
  /** Icono opcional mostrado en una pastilla a la derecha. */
  icon?: ReactNode
  delay?: number
}

// Tarjeta de métrica para el dashboard.
export default function DashboardCard({ title, value, subtitle, icon, delay = 0 }: Props) {
  return (
    <AnimatedCard delay={delay} hoverable>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-3xl font-bold tracking-tight text-brand-700">{value}</p>
          <p className="mt-0.5 text-xs font-medium text-slate-600">{title}</p>
          {subtitle && <p className="mt-0.5 text-[11px] text-slate-400">{subtitle}</p>}
        </div>
        {icon && (
          <span
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>
    </AnimatedCard>
  )
}
