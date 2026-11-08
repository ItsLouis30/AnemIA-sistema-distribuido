"""
agents/orchestrator_agent.py — Orquestador
================================================================
Coordina la ejecución secuencial de los 6 agentes y consolida un reporte
clínico unificado. Acepta un `logger` opcional (callable) para que el
backend persista cada paso en la base de datos sin acoplar los agentes a ella.

Flujo:
    Data → Preprocessing → Prediction → Explainability → Recommendation → Monitoring
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional

from agents.base import AgentLog
from agents.data_agent import DataAgent
from agents.explainability_agent import ExplainabilityAgent
from agents.monitoring_agent import MonitoringAgent
from agents.preprocessing_agent import PreprocessingAgent
from agents.prediction_agent import PredictionAgent
from agents.recommendation_agent import RecommendationAgent


class Orchestrator:
    """Orquestador del sistema multiagente de AnemIA."""

    def __init__(self, logger: Optional[Callable[[AgentLog], None]] = None):
        self.logger = logger
        # Orden de ejecución del pipeline (Monitoring corre al final).
        self.pipeline = [
            DataAgent(),
            PreprocessingAgent(),
            PredictionAgent(),
            ExplainabilityAgent(),
            RecommendationAgent(),
        ]
        self.monitoring = MonitoringAgent()

    def run(self, case: Dict[str, Any], model: str = "random_forest") -> Dict[str, Any]:
        context: Dict[str, Any] = {"case": dict(case), "model": model, "agent_logs": []}

        for agent in self.pipeline:
            log = agent.run(context)
            self._record(context, log)
            if log.status == "error":
                # Se detiene la cadena ante un error crítico de validación/datos.
                break

        # El agente de monitoreo siempre se ejecuta para cerrar la auditoría.
        mon_log = self.monitoring.run(context)
        self._record(context, mon_log)

        return self._consolidate(context)

    def _record(self, context: Dict[str, Any], log: AgentLog) -> None:
        context["agent_logs"].append({
            "agent": log.agent,
            "status": log.status,
            "elapsed_ms": log.elapsed_ms,
            "message": log.message,
        })
        if self.logger:
            try:
                self.logger(log)
            except Exception:  # noqa: BLE001
                pass  # el logging nunca debe romper el pipeline

    def _consolidate(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Genera el reporte clínico unificado (Agente Coordinador)."""
        results = context.get("results", {})
        prediction = context.get("prediction")
        ok = prediction is not None
        return {
            "ok": ok,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "model": context.get("model"),
            "case": context["case"],
            "preprocessing": results.get("preprocessing_agent"),
            "prediction": prediction,
            "explainability": context.get("explainability"),
            "recommendation": context.get("recommendation"),
            "monitoring": context.get("monitoring"),
            "agent_logs": context["agent_logs"],
            "error": None if ok else context["agent_logs"][-1].get("message"),
        }
