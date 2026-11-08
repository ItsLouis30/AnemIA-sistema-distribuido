"""
backend/app/api/routes_dashboard.py
================================================================
  GET /dashboard — métricas y resúmenes estadísticos del sistema.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.services.dashboard_service import build_dashboard

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):
    return build_dashboard(db)
