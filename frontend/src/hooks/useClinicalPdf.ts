import { useCallback, useState } from 'react'

import { generateClinicalPdf, printClinicalPdf } from '../lib/pdf'
import type { AgentRunReport } from '../types'

/**
 * Encapsula la generación del PDF clínico vectorial con estado de carga
 * y manejo de error. La lógica de maquetado vive en lib/pdf.ts.
 */
export function useClinicalPdf() {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const downloadPdf = useCallback(async (report: AgentRunReport) => {
    setGenerating(true)
    setError(null)
    try {
      await generateClinicalPdf(report)
    } catch {
      setError('No se pudo generar el PDF. Inténtalo nuevamente.')
    } finally {
      setGenerating(false)
    }
  }, [])

  const printPdf = useCallback(async (report: AgentRunReport) => {
    setGenerating(true)
    setError(null)
    try {
      await printClinicalPdf(report)
    } catch {
      setError('No se pudo abrir el PDF para imprimir.')
    } finally {
      setGenerating(false)
    }
  }, [])

  return { generating, error, downloadPdf, printPdf }
}
