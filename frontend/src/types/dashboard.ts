import type { AgentLogEntry } from './agent'

export interface PerClassMetric {
  precision: number
  recall: number
  f1: number
  specificity: number
  support: number
}

/** Bloque de métricas de un conjunto (train o test). */
export interface MetricBlock {
  accuracy: number
  balanced_accuracy: number
  f1_macro: number
  f1_weighted: number
  cohen_kappa: number
  mcc: number
  roc_auc_macro_ovr: number | null
  pr_auc_macro: number | null
  log_loss: number | null
  classes: string[]
  confusion_matrix: number[][]
  per_class: Record<string, PerClassMetric>
  n_test: number
}

/** Métricas completas del artefacto del modelo (test + train + meta). */
export interface ModelMetrics extends MetricBlock {
  test: MetricBlock
  train: MetricBlock
  class_distribution: {
    raw_train: Record<string, number>
    after_smote: Record<string, number>
  }
  split: {
    strategy?: string
    test_size: number
    n_train: number
    n_test: number
    balancing: string
  }
}

export interface ModelStatus {
  name: string
  trained: boolean
  metrics?: ModelMetrics
  trained_at?: string
}

export interface DashboardData {
  total_predictions: number
  by_diagnosis: Record<string, number>
  by_model: Record<string, number>
  recent_logs: AgentLogEntry[]
  database: string
}
