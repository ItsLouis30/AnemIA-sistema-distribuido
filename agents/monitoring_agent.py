"""
agents/monitoring_agent.py — Agente 6 · Monitoreo / Coordinador
================================================================
Audita el ciclo de vida del pipeline: tiempos por agente, modelo usado y
estado general. Consolida los logs para que el orquestador / backend los
persista en PostgreSQL.
"""
from __future__ import annotations

from typing import Any, Dict

from agents.base import Agent


class MonitoringAgent(Agent):
    name = "monitoring_agent"
    description = "Audita tiempos de ejecución y consolida los logs."

    def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        logs = context.get("agent_logs", [])
        total_ms = round(sum(log.get("elapsed_ms", 0) for log in logs), 2)
        errors = [log for log in logs if log.get("status") == "error"]

        summary = {
            "_message": f"Pipeline auditado: {len(logs)} agentes, {total_ms} ms totales.",
            "model": context.get("model", "random_forest"),
            "total_elapsed_ms": total_ms,
            "agents_run": len(logs),
            "errors": len(errors),
            "status": "ok" if not errors else "completed_with_errors",
        }
        context["monitoring"] = summary
        return summary
