import type { ClinicalCase, DiagnosisCode, PredictionResult } from './prediction'
import type { ExplanationResult, ShapResult } from './explanation'

export interface AgentLogEntry {
  agent: string
  status: 'ok' | 'error'
  elapsed_ms: number
  message: string
  created_at?: string
  run_id?: string
}

export interface Recommendation {
  diagnosis_code: DiagnosisCode
  title: string
  color: string
  items: string[]
  source: string
}

export interface AgentRunReport {
  ok: boolean
  run_id?: string
  generated_at: string
  model?: string
  case: ClinicalCase
  preprocessing?: {
    hb_observed: number
    altitude_m: number
    adjustment: number
    hbc: number
    normative_framework: string
  }
  prediction?: PredictionResult
  explainability?: {
    shap: ShapResult
    lime: ExplanationResult
    top_factor: string
  }
  recommendation?: Recommendation
  monitoring?: {
    total_elapsed_ms: number
    agents_run: number
    errors: number
    status: string
  }
  agent_logs: AgentLogEntry[]
  error?: string | null
}
