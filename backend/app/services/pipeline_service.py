"""
backend/app/services/pipeline_service.py
================================================================
Servicio de orquestación del sistema multiagente. Ejecuta el pipeline
completo de 6 agentes y persiste el resultado vía database_service.
"""
from __future__ import annotations

import uuid
from typing import Any, Dict

from agents.orchestrator_agent import Orchestrator
from backend.app.services.database_service import persist_run

LAST_REPORT = None

def run_pipeline(case, model="random_forest"):
    global LAST_REPORT
    run_id = uuid.uuid4().hex[:12]
    report = Orchestrator().run(case, model=model)
    report["run_id"] = run_id
    report["persisted"] = persist_run(run_id, report)
    LAST_REPORT = report
    return report