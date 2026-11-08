// ============================================================
//  Hook useCaseStats — estadísticas del panel derivadas del MISMO
//  historial que alimenta la barra lateral de «Consultas recientes»
//  (IndexedDB, vía useConversations). Garantiza que el conteo del Panel
//  y la lista de recientes nunca se desincronicen.
//
//  Migración a backend: el día que exista un endpoint de historial real
//  (p. ej. GET /predictions), basta con que useConversations cambie su
//  fuente; este hook seguirá funcionando sin tocarse, porque solo deriva
//  métricas a partir de los resúmenes de conversación.
// ============================================================
import { useMemo } from 'react'

import { useConversations } from './useConversations'

export interface CaseStats {
  /** Total de consultas guardadas (= nº de ítems en la barra lateral). */
  total: number
  /** Consultas que llegaron a producir una predicción/diagnóstico. */
  predictions: number
  /** Conteo por etiqueta de diagnóstico (solo consultas con predicción). */
  byDiagnosis: Record<string, number>
  /** `true` mientras se lee el historial local por primera vez. */
  loading: boolean
  /** Relee el historial local bajo demanda. */
  refresh: () => Promise<void>
}

/**
 * Deriva las métricas del panel a partir de los resúmenes de conversación.
 * Una consulta cuenta como «predicción» cuando tiene `diagnosisLabel`, que
 * `toSummary` rellena únicamente si la conversación tiene un reporte con
 * predicción (`report.prediction.diagnosis_label`).
 */
export function useCaseStats(): CaseStats {
  const { summaries, loading, refresh } = useConversations()

  return useMemo(() => {
    const byDiagnosis: Record<string, number> = {}
    let predictions = 0
    for (const s of summaries) {
      if (!s.diagnosisLabel) continue
      predictions += 1
      byDiagnosis[s.diagnosisLabel] = (byDiagnosis[s.diagnosisLabel] ?? 0) + 1
    }
    return { total: summaries.length, predictions, byDiagnosis, loading, refresh }
  }, [summaries, loading, refresh])
}
