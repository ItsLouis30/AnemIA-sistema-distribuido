import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

type Side = 'left' | 'right'

interface Props {
  open: boolean
  onClose: () => void
  side?: Side
  title?: string
  /** Ancho en desktop (clase Tailwind). En móvil ocupa casi todo el ancho. */
  widthClass?: string
  children: ReactNode
  /** Etiqueta accesible si no se pasa `title`. */
  ariaLabel?: string
}

/**
 * Drawer lateral reutilizable: backdrop con fade, panel deslizante,
 * cierre con Escape / swipe / click en backdrop, scroll-lock del body y
 * respeto a `prefers-reduced-motion`. Solo `transform`/`opacity` (GPU).
 */
export default function Drawer({
  open,
  onClose,
  side = 'right',
  title,
  widthClass = 'w-[88%] max-w-sm',
  children,
  ariaLabel,
}: Props) {
  const reduce = useReducedMotion()

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Bloquear scroll del body mientras está abierto
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const offscreen = side === 'right' ? '100%' : '-100%'
  const transition = reduce
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 320, damping: 34 }

  // Swipe-to-close: arrastrar hacia el borde correspondiente.
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (side === 'right' && info.offset.x > 80) onClose()
    if (side === 'left' && info.offset.x < -80) onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title || ariaLabel}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: offscreen }}
            animate={{ x: 0 }}
            exit={{ x: offscreen }}
            transition={transition}
            drag="x"
            dragElastic={0.05}
            dragMomentum={false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            className={`absolute top-0 bottom-0 ${side === 'right' ? 'right-0' : 'left-0'} ${widthClass} flex flex-col bg-white shadow-2xl dark:bg-slate-900`}
          >
            {title && (
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-white/10">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h2>
                <button
                  onClick={onClose}
                  aria-label="Cerrar panel"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}
