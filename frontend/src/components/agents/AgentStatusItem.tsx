import { motion } from 'framer-motion'

import type { AgentStatus } from '../../types'

const dotColors: Record<AgentStatus, string> = {
  pending: 'bg-slate-300',
  running: 'bg-teal-500 animate-pulse',
  completed: 'bg-emerald-500',
  error: 'bg-red-500',
}

interface Props {
  index: number
  name: string
  description: string
  status: AgentStatus
  detail?: string
}

export default function AgentStatusItem({ index, name, description, status, detail }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition hover:bg-slate-50"
      role="listitem"
      aria-label={`${name}: ${status === 'completed' ? 'Completado' : status === 'running' ? 'En progreso' : status === 'error' ? 'Error' : 'Pendiente'}`}
    >
      <span className={`h-2 w-2 rounded-full flex-shrink-0 transition ${dotColors[status]}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-700 truncate leading-tight">{name}</p>
        <p className="text-[10px] text-slate-400 truncate leading-tight">{detail || description}</p>
      </div>
    </motion.div>
  )
}
