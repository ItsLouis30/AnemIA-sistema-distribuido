"""
explainability/lime_explainer.py
================================================================
Explicabilidad LIME (tabular) para un caso individual. Construye un
explicador sobre el espacio transformado por el ColumnTransformer y devuelve
los pesos locales agregados por variable original.

Si LIME no está disponible se usa un respaldo basado en la importancia del
modelo para mantener operativa la demo.
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
from ml.preprocessing_pipeline import (
    CLASS_ORDER,
    case_to_frame,
    load_dataset,
    split_xy,
)
from ml.inference import SAVED_MODELS_DIR  # noqa: F401  (ruta de artefactos)

# Pequeña muestra de referencia para que LIME estime distribuciones.
_BACKGROUND_CACHE: Dict[str, np.ndarray] = {}


def _background(preprocessor, n: int = 500) -> np.ndarray:
    key = id(preprocessor)
    if str(key) in _BACKGROUND_CACHE:
        return _BACKGROUND_CACHE[str(key)]
    import os
    data_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "data", "raw", "dataset.csv",
    )
    df = load_dataset(data_path).sample(n=min(n, 2000), random_state=7)
    X, _ = split_xy(df)
    bg = preprocessor.transform(X)
    _BACKGROUND_CACHE[str(key)] = bg
    return bg


def local_explanation(case: dict, model_name: str = "random_forest",
                      top_k: int = 6) -> Dict:
    """Explicación LIME local para un caso individual."""
    artifact = load_model(model_name)
    pipeline = artifact["pipeline"]
    preprocessor = pipeline.named_steps["preprocessor"]
    model = pipeline.named_steps["model"]
    feature_names = get_feature_names(preprocessor)

    frame = case_to_frame(case)
    X_t = preprocessor.transform(frame)[0]

    method = "lime"
    try:
        from lime.lime_tabular import LimeTabularExplainer

        bg = _background(preprocessor)
        explainer = LimeTabularExplainer(
            training_data=bg,
            feature_names=feature_names,
            class_names=CLASS_ORDER,
            discretize_continuous=True,
            mode="classification",
        )
        pred_idx = int(np.argmax(model.predict_proba(X_t.reshape(1, -1))[0]))
        exp = explainer.explain_instance(
            X_t,
            model.predict_proba,
            num_features=min(len(feature_names), 12),
            labels=(pred_idx,),
        )
        weights = np.zeros(len(feature_names))
        for idx, w in exp.local_exp[pred_idx]:
            weights[idx] = w
    except Exception as exc:  # noqa: BLE001
        method = "feature_importances_fallback"
        weights = np.abs(np.asarray(getattr(model, "feature_importances_", [])))
        if len(weights) != len(feature_names):
            return {"method": "unavailable", "error": str(exc), "factors": []}

    agg = aggregate_by_variable(feature_names, np.abs(weights))
    return {
        "method": method,
        "model": model_name,
        "factors": to_frontend_payload(agg, top_k=top_k),
    }
