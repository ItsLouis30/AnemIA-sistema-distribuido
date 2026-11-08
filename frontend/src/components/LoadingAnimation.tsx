import { motion, useReducedMotion } from 'framer-motion'

import { BrandMark } from './brand/BrandLogo'

interface Props {
  label?: string
}

// Estado de carga/análisis con identidad de marca: la marca de AnemIA con un
// anillo de pulso clínico y la etiqueta. Reutilizable (panel, análisis…).
export default function LoadingAnimation({ label = 'Cargando…' }: Props) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-4 py-16 text-slate-500"
      role="status"
      aria-live="polite"
    >
      <div className="relative flex h-16 w-16 items-center justify-center">
        {!reduce && (
          <>
            <motion.span
              className="absolute inset-0 rounded-2xl ring-2 ring-teal-400/40"
              animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.span
              className="absolute inset-0 rounded-2xl ring-2 ring-teal-400/30"
              animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
            />
          </>
        )}
        <BrandMark size={48} animated={false} idle={!reduce} />
      </div>
      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
        {label}
        {!reduce && (
          <span className="inline-flex gap-0.5" aria-hidden="true">
            {[0, 0.18, 0.36].map((delay) => (
              <motion.span
                key={delay}
                className="h-1 w-1 rounded-full bg-teal-500"
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.1, repeat: Infinity, delay, ease: 'easeInOut' }}
              />
            ))}
          </span>
        )}
      </div>
    </motion.div>
  )
}
