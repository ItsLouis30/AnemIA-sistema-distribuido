export interface XaiFactor {
  feature: string
  label: string
  weight: number
  weight_norm: number
}

export interface ExplanationResult {
  method: string
  model: string
  factors: XaiFactor[]
}

export interface ShapResult {
  global: XaiFactor[]
  local: ExplanationResult
}
