"""
agents/explainability_agent.py — Agente 4 · Explicabilidad XAI
================================================================
Genera explicaciones SHAP (global + local) y LIME (local) para el caso,
extrayendo los factores de mayor influencia en el diagnóstico.
"""
from __future__ import annotations

from typing import Any, Dict

from agents.base import Agent
from explainability import lime_explainer, shap_explainer


class ExplainabilityAgent(Agent):
    name = "explainability_agent"
    description = "Calcula importancia de variables vía SHAP y LIME."

    def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        case = context["case"]
        model_name = context.get("model", "random_forest")

        shap_local = shap_explainer.local_explanation(case, model_name)
        shap_global = shap_explainer.global_importance(model_name)
        lime_local = lime_explainer.local_explanation(case, model_name)

        top = shap_local.get("factors") or shap_global
        top_factor = top[0]["label"] if top else "—"

        result = {
            "_message": f"Factor más influyente: {top_factor}.",
            "shap": {"global": shap_global, "local": shap_local},
            "lime": lime_local,
            "top_factor": top_factor,
        }
        context["explainability"] = result
        return result
