"""
backend/app/services/dashboard_service.py
================================================================
Servicio del dashboard: agrega métricas y resúmenes desde PostgreSQL.
"""
from __future__ import annotations

from collections import Counter
from typing import Any, Dict

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.database import db_available
from backend.app.models import AgentLog, Prediction


def build_dashboard(db: Session) -> Dict[str, Any]:
    if not db_available():
        return {
            "total_predictions": 0, "by_diagnosis": {}, "by_model": {},
            "recent_logs": [], "database": "unavailable",
        }

    preds = db.execute(select(Prediction)).scalars().all()
    by_diagnosis = Counter(p.diagnosis_label for p in preds)
    by_model = Counter(p.model_name for p in preds)
    logs = db.execute(
        select(AgentLog).order_by(AgentLog.id.desc()).limit(10)
    ).scalars().all()

    return {
        "total_predictions": len(preds),
        "by_diagnosis": dict(by_diagnosis),
        "by_model": dict(by_model),
        "recent_logs": [
            {
                "run_id": r.run_id, "agent": r.agent, "status": r.status,
                "elapsed_ms": r.elapsed_ms,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in logs
        ],
        "database": "connected",
    }
