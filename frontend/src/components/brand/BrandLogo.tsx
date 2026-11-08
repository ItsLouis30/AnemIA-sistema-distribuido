import { motion, useReducedMotion } from 'framer-motion'
import { useId } from 'react'

import { easeOut } from '../../lib/motion'

/**
 * Marca de AnemIA. Glifo propio (no un icono de librería) que codifica la idea
 * del producto: un trazo de pulso clínico que asciende como un perfil de altitud
 * (Puno) hacia una gota de hemoglobina, con un nodo "IA" en la línea base.
 *
 * Se reutiliza en cabecera, panel lateral, avatar del asistente, estados de
 * carga y favicon. El wordmark resalta la «IA» final del nombre (AnemIA = IA).
 */

interface MarkProps {
  /** Lado del tile en px. */
  size?: number
  /** Anima la entrada y el trazo del pulso. */
  animated?: boolean
  /** Pulso continuo y muy sutil en el nodo IA (loop). */
  idle?: boolean
  className?: string
  title?: string
}

export function BrandMark({ size = 36, animated = true, idle = true, className = '', title }: MarkProps) {
  const reduce = useReducedMotion()
  const uid = useId()
  const gradId = `anemia-grad-${uid}`
  const glowId = `anemia-glow-${uid}`
  const playEntrance = animated && !reduce
  const playIdle = idle && !reduce

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={className}
      initial={playEntrance ? { opacity: 0, scale: 0.88, rotate: -4 } : false}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.5, ease: easeOut }}
    >
      <defs>
        <linearGradient id={gradId} x1="6" y1="3" x2="34" y2="37" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2dd4bf" />
          <stop offset="0.55" stopColor="#0d9488" />
          <stop offset="1" stopColor="#0f5e58" />
        </linearGradient>
        <radialGradient id={glowId} cx="0.32" cy="0.24" r="0.85">
          <stop stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Tile clínico redondeado */}
      <rect x="1.5" y="1.5" width="37" height="37" rx="11.5" fill={`url(#${gradId})`} />
      <rect x="1.5" y="1.5" width="37" height="37" rx="11.5" fill={`url(#${glowId})`} />
      <rect
        x="2.25" y="2.25" width="35.5" height="35.5" rx="10.75"
        fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1"
      />

      {/* Gota de hemoglobina (arriba-derecha) */}
      <motion.path
        d="M27 5.4c3.7 5 5.9 7.8 5.9 10.5a5.9 5.9 0 1 1-11.8 0c0-2.7 2.2-5.5 5.9-10.5Z"
        fill="#ffffff"
        initial={playEntrance ? { scale: 0, opacity: 0 } : false}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, delay: 0.18, ease: easeOut }}
        style={{ transformOrigin: '27px 18px' }}
      />
      {/* Reflejo interno de la gota */}
      <circle cx="24.7" cy="15.6" r="1.7" fill="#0d9488" fillOpacity="0.18" />

      {/* Trazo de pulso ECG que asciende (perfil de altitud) */}
      <motion.path
        d="M4 30.2H10l2.1-3.8 2.7 8.6 2.5-12.4 2.1 7.7H33"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={playEntrance ? { pathLength: 0, opacity: 0 } : false}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.12, ease: easeOut }}
      />

      {/* Nodo IA en la base del pulso */}
      <motion.circle
        cx="4" cy="30.2" r="2.1" fill="#ccfbf1"
        animate={playIdle ? { scale: [1, 1.18, 1], opacity: [0.85, 1, 0.85] } : undefined}
        transition={playIdle ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : undefined}
        style={{ transformOrigin: '4px 30.2px' }}
      />
      <circle cx="4" cy="30.2" r="0.9" fill="#0f766e" />
    </motion.svg>
  )
}

interface LogoProps extends MarkProps {
  /** Muestra el wordmark «AnemIA» junto a la marca. */
  showWordmark?: boolean
  /** Línea secundaria bajo el wordmark. */
  subtitle?: string
  /** Tamaño del wordmark. */
  wordmarkSize?: 'sm' | 'md' | 'lg'
}

const wordmarkScale: Record<NonNullable<LogoProps['wordmarkSize']>, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
}

export default function BrandLogo({
  size = 36,
  animated = true,
  idle = true,
  showWordmark = true,
  subtitle,
  wordmarkSize = 'md',
  className = '',
  title = 'AnemIA',
}: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <BrandMark size={size} animated={animated} idle={idle} title={showWordmark ? undefined : title} />
      {showWordmark && (
        <span className="min-w-0 leading-none">
          <span className={`block font-extrabold tracking-tightest text-slate-800 ${wordmarkScale[wordmarkSize]}`}>
            Anem<span className="text-teal-600">IA</span>
          </span>
          {subtitle && (
            <span className="mt-1 block truncate text-[11px] font-medium leading-none text-slate-400">
              {subtitle}
            </span>
          )}
        </span>
      )}
    </span>
  )
}
