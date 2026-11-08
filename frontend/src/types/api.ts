// Tipos auxiliares para las respuestas de la API.
export interface ApiError {
  detail: string
}

export interface ModelStatusResponse {
  models: import('./dashboard').ModelStatus[]
}

export interface AgentLogsResponse {
  database: string
  logs: import('./agent').AgentLogEntry[]
}
