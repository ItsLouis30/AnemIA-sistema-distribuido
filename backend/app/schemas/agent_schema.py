"""
backend/app/schemas/agent_schema.py
================================================================
Esquemas de salida para la ejecución del sistema multiagente.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class AgentLogEntry(BaseModel):
    agent: str
    status: str
    elapsed_ms: float
    message: str = ""
    run_id: Optional[str] = None
    created_at: Optional[str] = None


class AgentRunResponse(BaseModel):
    ok: bool
    run_id: Optional[str] = None
    generated_at: str
    model: Optional[str] = None
    case: Dict[str, Any]
    preprocessing: Optional[Dict[str, Any]] = None
    prediction: Optional[Dict[str, Any]] = None
    explainability: Optional[Dict[str, Any]] = None
    recommendation: Optional[Dict[str, Any]] = None
    monitoring: Optional[Dict[str, Any]] = None
    agent_logs: List[Dict[str, Any]] = []
    error: Optional[str] = None
