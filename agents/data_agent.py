"""
agents/data_agent.py — Agente 1 · Registro Clínico
================================================================
Valida tipos, rangos y campos obligatorios del caso clínico de entrada.
"""
from __future__ import annotations

from typing import Any, Dict

from agents.base import Agent

REQUIRED_NUMERIC = {
    "EdadMeses": (0, 180),
    "Hemoglobina": (0, 25),
    "AlturaREN": (0, 6000),
}
REQUIRED_STR = ["Sexo"]
BINARY_FIELDS = ["Juntos", "SIS", "Qaliwarma", "Cred", "Suplementacion", "Consejeria", "Sesion"]


class DataAgent(Agent):
    name = "data_agent"
    description = "Valida y normaliza el registro clínico de entrada."

    def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        case = context["case"]
        errors = []

        for field, (lo, hi) in REQUIRED_NUMERIC.items():
            val = case.get(field)
            if val is None:
                errors.append(f"Falta el campo obligatorio '{field}'.")
                continue
            try:
                num = float(val)
            except (TypeError, ValueError):
                errors.append(f"'{field}' debe ser numérico.")
                continue
            if not (lo < num <= hi):
                errors.append(f"'{field}'={num} fuera de rango ({lo}, {hi}].")
            case[field] = num

        for field in REQUIRED_STR:
            if not case.get(field):
                errors.append(f"Falta el campo obligatorio '{field}'.")

        for field in BINARY_FIELDS:
            case[field] = int(bool(case.get(field, 0)))

        if errors:
            raise ValueError(" ".join(errors))

        context["case"] = case
        return {
            "_message": "Datos clínicos validados correctamente.",
            "valid": True,
            "normalized_case": case,
        }
