"""
backend/app/services/explainability_service.py
================================================================
Servicio de explicabilidad: envuelve los explicadores SHAP y LIME.
"""
from __future__ import annotations

from typing import Any, Dict

from explainability import lime_explainer, shap_explainer


def shap_explanation(case: Dict[str, Any], model_name: str = "random_forest") -> Dict[str, Any]:
    return {
        "global": shap_explainer.global_importance(model_name),
        "local": shap_explainer.local_explanation(case, model_name),
    }


def lime_explanation(case: Dict[str, Any], model_name: str = "random_forest") -> Dict[str, Any]:
    return lime_explainer.local_explanation(case, model_name)
