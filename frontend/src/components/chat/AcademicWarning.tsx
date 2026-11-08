import { ShieldAlert } from 'lucide-react'

export default function AcademicWarning() {
  return (
    <div className="border-b border-amber-200/70 bg-gradient-to-r from-amber-50 to-amber-50/40 dark:border-amber-500/20 dark:from-amber-500/[0.08] dark:to-transparent">
      <div className="mx-auto flex max-w-7xl items-center gap-2.5 px-4 py-2 sm:px-5">
        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/25">
          <ShieldAlert size={13} aria-hidden="true" />
        </span>
        <p className="text-[11px] leading-snug text-amber-800 dark:text-amber-200">
          <strong className="font-bold">Prototipo académico.</strong>{' '}
          <span className="text-amber-700/90 dark:text-amber-300/80">
            No reemplaza el diagnóstico ni el tratamiento de profesionales de salud. Toda
            recomendación debe ser validada por personal médico autorizado.
          </span>
        </p>
      </div>
    </div>
  )
}
