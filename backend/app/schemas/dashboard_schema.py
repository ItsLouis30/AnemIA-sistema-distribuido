"""
backend/app/schemas/dashboard_schema.py
================================================================
Esquema de salida para el dashboard de métricas.
"""
from __future__ import annotations

from typing import Any, Dict, List

from pydantic import BaseModel


class DashboardResponse(BaseModel):
    total_predictions: int
    by_diagnosis: Dict[str, int]
    by_model: Dict[str, int]
    recent_logs: List[Dict[str, Any]]
    database: str
