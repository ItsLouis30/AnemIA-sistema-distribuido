"""
backend/app/api/routes_health.py
================================================================
  GET /health        — verificación de estado general.
  GET /models/status — estado y métricas de los modelos en memoria.
"""
from __future__ import annotations

from fastapi import APIRouter

from backend.app.core.config import get_settings
from backend.app.core.database import db_available
from backend.app.services.model_loader import get_status

router = APIRouter(tags=["health"])
settings = get_settings()


@router.get("/health")
def health():
    return {
        "status": "ok",
        "app": settings.app_name,
        "environment": settings.environment,
        "database": "connected" if db_available() else "unavailable",
        "models": get_status(),
    }


@router.get("/models/status")
def models_status():
    return {"models": get_status()}
