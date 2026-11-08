"""
agents/prediction_agent.py — Agente 3 · Predictivo ML
================================================================
Carga el modelo seleccionado (Random Forest o XGBoost) y estima la
severidad de la anemia para el caso ya preprocesado.
"""
from __future__ import annotations

from typing import Any, Dict

from agents.base import Agent
from ml.inference import predict
from ml.preprocessing_pipeline import classify_anemia


class PredictionAgent(Agent):
    name = "prediction_agent"
    description = "Estima el diagnóstico de severidad con el modelo ML."

    def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        case = context["case"]
        model_name = context.get("model", "random_forest")

        prediction = predict(case, model_name=model_name)

        # Diagnóstico clínico de referencia (puntos de corte OMS) para
        # contrastar con la salida del modelo.
        clinical = classify_anemia(float(case["Hbc"]), float(case["EdadMeses"]))

        result = {
            "_message": f"Diagnóstico estimado: {prediction['diagnosis_label']} "
                        f"({prediction['probability']}%).",
            **prediction,
            "clinical_reference": {
                "code": clinical.code,
                "label": clinical.label,
                "severity": clinical.severity,
                "risk": clinical.risk,
                "risk_pct": clinical.risk_pct,
            },
        }
        context["prediction"] = result
        return result
