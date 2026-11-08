"""
explainability/shap_explainer.py
================================================================
Explicabilidad SHAP para los modelos de árbol (RF / XGBoost).

Provee importancia GLOBAL (basada en el modelo) e importancia LOCAL para un
caso individual (TreeExplainer). Si SHAP falla o no está disponible, se
recurre a `feature_importances_` como respaldo para no romper la demo.
"""
from __future__ import annotations

from typing import Dict, List

import numpy as np

from explainability.explanation_utils import (
    aggregate_by_variable,
    get_feature_names,
    to_frontend_payload,
)
from ml.inference import load_model
from ml.preprocessing_pipeline import case_to_frame


def _split_pipeline(artifact):
    pipeline = artifact["pipeline"]
    preprocessor = pipeline.named_steps["preprocessor"]
    model = pipeline.named_steps["model"]
    return preprocessor, model


def global_importance(model_name: str = "random_forest", top_k: int = 6) -> List[Dict]:
    """Importancia global de variables a partir del modelo entrenado."""
    artifact = load_model(model_name)
    preprocessor, model = _split_pipeline(artifact)
    feature_names = get_feature_names(preprocessor)
    importances = getattr(model, "feature_importances_", None)
    if importances is None or len(feature_names) != len(importances):
        return []
    agg = aggregate_by_variable(feature_names, np.asarray(importances))
    return to_frontend_payload(agg, top_k=top_k)


def local_explanation(case: dict, model_name: str = "random_forest",
                      top_k: int = 6) -> Dict:
    """Explicación SHAP local para un caso individual."""
    artifact = load_model(model_name)
    preprocessor, model = _split_pipeline(artifact)
    feature_names = get_feature_names(preprocessor)

    frame = case_to_frame(case)
    X_t = preprocessor.transform(frame)

    method = "shap"
    try:
        import shap

        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_t)
        # Para multiclase shap_values puede ser lista (una matriz por clase).
        if isinstance(shap_values, list):
            pred_idx = int(np.argmax(model.predict_proba(X_t)[0]))
            row = np.asarray(shap_values[pred_idx])[0]
        else:
            arr = np.asarray(shap_values)
            row = arr[0] if arr.ndim == 2 else arr[0, :, 0]
        weights = np.abs(row)
    except Exception as exc:  # noqa: BLE001
        method = "feature_importances_fallback"
        weights = np.abs(np.asarray(getattr(model, "feature_importances_", [])))
        if len(weights) != len(feature_names):
            return {"method": "unavailable", "error": str(exc), "factors": []}

    agg = aggregate_by_variable(feature_names, weights)
    return {
        "method": method,
        "model": model_name,
        "factors": to_frontend_payload(agg, top_k=top_k),
    }
