// Variantes reutilizables de Framer Motion para un movimiento coherente y
// sutil en toda la app (entradas suaves, nada exagerado). El respeto a
// `prefers-reduced-motion` se gestiona globalmente con <MotionConfig
// reducedMotion="user"> en index.tsx, por lo que estas variantes no necesitan
// comprobarlo individualmente.
import type { Variants } from 'framer-motion'

// Curva de easing suave y consistente (ease-out tipo "expo" suave).
export const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1]

// Entrada con desvanecido + leve subida.
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: easeOut } },
}

// Desvanecido puro, sin desplazamiento (evita reflow).
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25, ease: easeOut } },
}

// Contenedor que escalona la entrada de sus hijos.
export const staggerContainer = (stagger = 0.07, delayChildren = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren } },
})

// Item para usar dentro de un staggerContainer.
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: easeOut } },
}

// Props sueltas para elevar sutilmente una tarjeta clicable al pasar el puntero.
export const hoverLift = {
  whileHover: { y: -3 },
  whileTap: { scale: 0.99 },
  transition: { duration: 0.2, ease: easeOut },
}

// Props sueltas para feedback de pulsación en botones/acciones.
export const tapScale = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.97 },
  transition: { duration: 0.15, ease: easeOut },
}

// Alias semántico de `tapScale` (nombre usado en el plan de rediseño).
export const softScale = tapScale

// Entrada con leve "pop" (escala + desvanecido). Útil para tarjetas/badges.
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.32, ease: easeOut } },
}

// Entrada deslizando desde la izquierda (ítems de barra lateral, listas).
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.28, ease: easeOut } },
}
