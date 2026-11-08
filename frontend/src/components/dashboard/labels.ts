// Etiquetas cortas y colores compartidos por los gráficos de rendimiento.
export const SHORT_LABEL: Record<string, string> = {
  Normal: 'Normal',
  AnemiaLeve: 'Leve',
  AnemiaModerada: 'Moderada',
  AnemiaSevera: 'Severa',
}

export const shortLabel = (cls: string): string => SHORT_LABEL[cls] ?? cls

export const fmt = (v: number | null | undefined, digits = 4): string =>
  v === null || v === undefined ? '—' : v.toFixed(digits)
