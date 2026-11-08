import { motion } from 'framer-motion'

import { BrandMark } from '../brand/BrandLogo'

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="mb-3 flex items-start gap-2.5 px-4"
      aria-label="AnemIA está escribiendo"
    >
      <div className="mt-5 flex-shrink-0" aria-hidden="true">
        <BrandMark size={30} animated={false} idle={false} />
      </div>
      <div className="min-w-0">
        <span className="mb-1 ml-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
          AnemIA
        </span>
        <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-white px-4 py-3.5 shadow-card ring-1 ring-slate-900/[0.06] dark:bg-slate-800 dark:ring-white/10">
          {[0, 0.18, 0.36].map((delay) => (
            <motion.span
              key={delay}
              animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
              transition={{ duration: 1.1, repeat: Infinity, delay, ease: 'easeInOut' }}
              className="h-2 w-2 rounded-full bg-teal-500"
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
