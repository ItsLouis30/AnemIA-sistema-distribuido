"""
agents/base.py
================================================================
Clase base y estructuras compartidas por todos los agentes.
Cada agente mide su tiempo de ejecución y reporta un `AgentLog`.
"""
from __future__ import annotations

import time
import traceback
from dataclasses import dataclass, field
from typing import Any, Dict


@dataclass
class AgentLog:
    agent: str
    status: str           # 'ok' | 'error'
    elapsed_ms: float
    message: str = ""
    detail: Dict[str, Any] = field(default_factory=dict)


class Agent:
    """Agente base: subclases implementan `process(context)`."""

    name: str = "agent"
    description: str = ""

    def process(self, context: Dict[str, Any]) -> Dict[str, Any]:  # pragma: no cover
        raise NotImplementedError

    def run(self, context: Dict[str, Any]) -> AgentLog:
        """Ejecuta el agente, muta `context` con su salida y devuelve el log."""
        start = time.perf_counter()
        try:
            output = self.process(context)
            elapsed = (time.perf_counter() - start) * 1000
            context.setdefault("results", {})[self.name] = output
            return AgentLog(self.name, "ok", round(elapsed, 2),
                            message=output.get("_message", "completado") if isinstance(output, dict) else "completado")
        except Exception as exc:  # noqa: BLE001
            elapsed = (time.perf_counter() - start) * 1000
            return AgentLog(self.name, "error", round(elapsed, 2),
                            message=str(exc),
                            detail={"trace": traceback.format_exc(limit=3)})
