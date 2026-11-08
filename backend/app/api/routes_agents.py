"""
backend/app/api/routes_agents.py
================================================================
  POST /agents/run  — orquesta el flujo completo de los 6 agentes.
  GET  /agents/logs — historial de ejecución (desde PostgreSQL).
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.core.database import db_available, get_db
from backend.app.schemas import AgentRunResponse, PredictRequest
from backend.app.services.database_service import fetch_agent_logs
from backend.app.services.pipeline_service import run_pipeline

router = APIRouter(prefix="/agents", tags=["agents"])


@router.post("/run", response_model=AgentRunResponse)
def agents_run(req: PredictRequest):
    report = run_pipeline(req.case.model_dump(), model=req.model)
    return AgentRunResponse(**report)


@router.get("/logs")
def agents_logs(limit: int = Query(50, ge=1, le=500), db: Session = Depends(get_db)):
    if not db_available():
        return {"database": "unavailable", "logs": []}
    return {"database": "connected", "logs": fetch_agent_logs(db, limit)}
