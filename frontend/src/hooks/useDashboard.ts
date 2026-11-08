// Hook useDashboard — métricas del dashboard y estado de modelos.
import { useCallback, useEffect, useState } from 'react'

import { getDashboardData, getModelStatus } from '../services/api'
import type { DashboardData, ModelStatus } from '../types'

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [models, setModels] = useState<ModelStatus[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [d, m] = await Promise.all([getDashboardData(), getModelStatus()])
      setData(d)
      setModels(m.models)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { data, models, loading, refresh }
}
