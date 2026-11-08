// ============================================================
//  Cliente HTTP (Axios) hacia el backend FastAPI de AnemIA.
//  La URL base se inyecta vía Webpack DefinePlugin (REACT_APP_API_URL).
// ============================================================
import axios from 'axios'

import type {
  AgentLogsResponse,
  AgentRunReport,
  ClinicalCase,
  DashboardData,
  ExplanationResult,
  ModelName,
  ModelStatusResponse,
  PredictionResult,
  ShapResult,
} from '../types'

// Webpack (DefinePlugin) reemplaza `process.env.REACT_APP_API_URL` por un
// literal en build; si no se definió la variable, cae al backend local.
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

export async function predict(
  clinicalCase: ClinicalCase,
  model: ModelName,
): Promise<PredictionResult> {
  const { data } = await api.post('/predict', { case: clinicalCase, model })
  return data
}

export async function getShapExplanation(
  clinicalCase: ClinicalCase,
  model: ModelName,
): Promise<ShapResult> {
  const { data } = await api.post('/explain/shap', { case: clinicalCase, model })
  return data
}

export async function getLimeExplanation(
  clinicalCase: ClinicalCase,
  model: ModelName,
): Promise<ExplanationResult> {
  const { data } = await api.post('/explain/lime', { case: clinicalCase, model })
  return data
}

export async function runAgents(
  clinicalCase: ClinicalCase,
  model: ModelName,
): Promise<AgentRunReport> {
  const { data } = await api.post('/agents/run', { case: clinicalCase, model })
  return data
}

export async function getAgentLogs(): Promise<AgentLogsResponse> {
  const { data } = await api.get('/agents/logs')
  return data
}

export async function getModelStatus(): Promise<ModelStatusResponse> {
  const { data } = await api.get('/models/status')
  return data
}

export async function getDashboardData(): Promise<DashboardData> {
  const { data } = await api.get('/dashboard')
  return data
}

export async function getHealth() {
  const { data } = await api.get('/health')
  return data
}

// No hay endpoint /chat/message — el chat usa POST /agents/run

export async function sendChatMessage(
  message: string
) {

  const { data } = await api.post(
    "/chat",
    {
      message
    }
  )

  return data
}
