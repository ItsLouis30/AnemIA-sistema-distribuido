import { ShieldAlert } from 'lucide-react'
import type { ReactNode } from 'react'

import Header from './Header'

interface Props {
  children: ReactNode
  hideLayout?: boolean
}

/**
 * Marco de página para las vistas que NO son el chat: cabecera, aviso de
 * prototipo y área principal con scroll propio (dentro del AppShell, que aporta
 * la barra lateral de navegación). El chat aporta su propio layout a pantalla
 * completa, por eso `hideLayout` lo deja pasar sin envolver.
 */
export default function MobileLayout({ children, hideLayout }: Props) {
  if (hideLayout) {
    return <div className="h-full min-h-0">{children}</div>
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Header />

      <div
        className="border-b border-amber-200/70 bg-gradient-to-r from-amber-50 to-amber-50/40 dark:border-amber-500/20 dark:from-amber-500/[0.08] dark:to-transparent"
        role="alert"
        aria-label="Aviso de prototipo académico"
      >
        <div className="mx-auto flex max-w-lg items-center gap-2.5 px-4 py-2 sm:max-w-2xl lg:max-w-5xl lg:px-6">
          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/25">
            <ShieldAlert size={13} aria-hidden="true" />
          </span>
          <p className="text-[11px] leading-snug text-amber-800 dark:text-amber-200">
            <strong className="font-bold">Prototipo académico.</strong>{' '}
            <span className="text-amber-700/90 dark:text-amber-300/80">
              No reemplaza el diagnóstico clínico profesional. Toda recomendación debe
              validarse por personal de salud.
            </span>
          </p>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg px-4 py-6 sm:max-w-2xl lg:max-w-5xl lg:px-6">
          {children}
        </div>
      </main>
    </div>
  )
}
