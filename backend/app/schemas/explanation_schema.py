"""
backend/app/schemas/explanation_schema.py
================================================================
Esquemas de salida para explicabilidad (SHAP / LIME).
"""
from __future__ import annotations

from typing import Any, Dict, List

from pydantic import BaseModel


class XaiFactor(BaseModel):
    feature: str
    label: str
    weight: float
    weight_norm: float


class ExplanationResponse(BaseModel):
    method: str
    model: str
    factors: List[Dict[str, Any]]


class ShapResponse(BaseModel):
    global_importance: List[Dict[str, Any]]
    local: ExplanationResponse
