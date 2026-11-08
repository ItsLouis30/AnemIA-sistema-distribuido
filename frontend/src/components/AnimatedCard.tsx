import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

import { easeOut } from '../lib/motion'

interface Props {
  children: ReactNode
  delay?: number
  className?: string
  /** Añade elevación sutil al pasar el puntero (para tarjetas clicables). */
  hoverable?: boolean
}

// Tarjeta con animación de entrada (Framer Motion).
export default function AnimatedCard({ children, delay = 0, className = '', hoverable = false }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: easeOut }}
      whileHover={hoverable ? { y: -3 } : undefined}
      className={`card ${hoverable ? 'hover:shadow-card-hover hover:border-slate-300' : ''} ${className}`}
    >
      {children}
    </motion.div>
  )
}
