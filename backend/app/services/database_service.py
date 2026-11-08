"""
backend/app/services/database_service.py
================================================================
Servicio de persistencia y consulta en PostgreSQL. Tolerante a fallos:
si la base de datos no está disponible, no interrumpe la respuesta.
"""
from __future__ import annotations

import json
from typing import Any, Dict, List

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.database import db_available, session_scope
from backend.app.models import (
    AgentLog,
    Evaluation,
    Explanation,
    Patient,
    Prediction,
    Recommendation,
)
from backend.app.utils.logger import get_logger

logger = get_logger("database_service")


def persist_run(run_id: str, report: Dict[str, Any]) -> bool:
    """Guarda evaluación, predicción, explicación, recomendación y logs."""
    if not db_available():
        return False
    try:
        with session_scope() as db:
            case = report["case"]
            pre = report.get("preprocessing") or {}
            pred = report.get("prediction") or {}
            expl = report.get("explainability") or {}
            rec = report.get("recommendation") or {}

            patient = Patient(
                sexo=case.get("Sexo", "F"),
                edad_meses=float(case.get("EdadMeses", 0)),
                provincia_ren=case.get("ProvinciaREN"),
                distrito_ren=case.get("DistritoREN"),
                altura_ren=float(case.get("AlturaREN", 0)),
            )
            db.add(patient)
            db.flush()

            evaluation = Evaluation(
                patient_id=patient.id,
                prov_eess=case.get("Prov_EESS"),
                dist_eess=case.get("Dist_EESS"),
                hemoglobina=float(case.get("Hemoglobina", 0)),
                altura_ren=float(case.get("AlturaREN", 0)),
                hbc=float(pre.get("hbc", case.get("Hbc", 0))),
                adjustment=float(pre.get("adjustment", 0)),
                juntos=bool(case.get("Juntos")), sis=bool(case.get("SIS")),
                qaliwarma=bool(case.get("Qaliwarma")), cred=bool(case.get("Cred")),
                suplementacion=bool(case.get("Suplementacion")),
                consejeria=bool(case.get("Consejeria")), sesion=bool(case.get("Sesion")),
            )
            db.add(evaluation)
            db.flush()

            prediction = Prediction(
                evaluation_id=evaluation.id,
                model_name=pred.get("model", "random_forest"),
                diagnosis_code=pred.get("diagnosis_code", "Normal"),
                diagnosis_label=pred.get("diagnosis_label", "Normal"),
                probability=float(pred.get("probability", 0)),
                class_probabilities=json.dumps(pred.get("class_probabilities", {})),
            )
            db.add(prediction)
            db.flush()

            db.add(Explanation(
                prediction_id=prediction.id, method="shap+lime",
                payload=json.dumps(expl, ensure_ascii=False)[:60000],
            ))
            db.add(Recommendation(
                prediction_id=prediction.id,
                diagnosis_code=rec.get("diagnosis_code", "Normal"),
                title=rec.get("title", ""),
                items=json.dumps(rec.get("items", []), ensure_ascii=False),
            ))
            for log in report.get("agent_logs", []):
                db.add(AgentLog(
                    run_id=run_id, agent=log.get("agent", "?"),
                    status=log.get("status", "ok"),
                    elapsed_ms=float(log.get("elapsed_ms", 0)),
                    message=log.get("message", ""),
                ))
        return True
    except Exception as exc:  # noqa: BLE001
        logger.warning("No se pudo persistir el run %s: %s", run_id, exc)
        return False


def fetch_agent_logs(db: Session, limit: int = 50) -> List[Dict[str, Any]]:
    rows = db.execute(
        select(AgentLog).order_by(AgentLog.id.desc()).limit(limit)
    ).scalars().all()
    return [
        {
            "run_id": r.run_id, "agent": r.agent, "status": r.status,
            "elapsed_ms": r.elapsed_ms, "message": r.message,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]
