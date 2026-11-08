export type ModelName = 'random_forest' | 'xgboost'

export type DiagnosisCode =
  | 'Normal'
  | 'AnemiaLeve'
  | 'AnemiaModerada'
  | 'AnemiaSevera'

export interface ClinicalCase {
  Prov_EESS?: string
  Dist_EESS?: string
  Sexo: 'F' | 'M'
  EdadMeses: number
  Juntos: number
  SIS: number
  Qaliwarma: number
  Cred: number
  Suplementacion: number
  Consejeria: number
  Sesion: number
  Hemoglobina: number
  ProvinciaREN?: string
  DistritoREN?: string
  AlturaREN: number
}

export interface PredictionResult {
  model: string
  diagnosis_code: DiagnosisCode
  diagnosis_label: string
  probability: number
  class_probabilities: Record<string, number>
  hbc: number
  clinical_reference?: {
    code: DiagnosisCode
    label: string
    severity: string
    risk: string
    risk_pct: number
  }
}
