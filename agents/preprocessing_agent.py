"""
agents/preprocessing_agent.py — Agente 2 · Clínico-Contextual
================================================================
Aplica la corrección de hemoglobina por altitud (OMS 2024 / MINSA) y
calcula la Hbc que alimentará al modelo predictivo.
"""
from __future__ import annotations

from typing import Any, Dict

from agents.base import Agent
from ml.preprocessing_pipeline import (
    altitude_adjustment,
    correct_hemoglobin_for_altitude,
)


class PreprocessingAgent(Agent):
    name = "preprocessing_agent"
    description = "Calcula la hemoglobina corregida por altitud (Hbc)."

    def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        case = context["case"]
        hb = float(case["Hemoglobina"])
        altitude = float(case["AlturaREN"])

        adjustment = altitude_adjustment(altitude)
        hbc = correct_hemoglobin_for_altitude(hb, altitude)
        case["Hbc"] = hbc
        context["case"] = case

        return {
            "_message": f"Hb {hb} g/dL ajustada a Hbc {hbc} g/dL.",
            "hb_observed": hb,
            "altitude_m": altitude,
            "adjustment": round(adjustment, 2),
            "hbc": hbc,
            "normative_framework": "OMS 2024 / RM-258-2020-MINSA",
        }
