"""
ml/inference.py
================================================================
Carga perezosa de los modelos entrenados y API de inferencia usada por el
backend y los agentes. Si no existe un modelo entrenado, entrena uno mínimo
sobre el dataset (o datos dummy) para no bloquear la demo.
"""
from __future__ import annotations

import os
from functools import lru_cache
from typing import Dict, List, Optional

import joblib
import numpy as np

from ml.preprocessing_pipeline import (
    CLASS_ORDER,
    DX_LABELS_ES,
    case_to_frame,
    correct_hemoglobin_for_altitude,
)

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
SAVED_MODELS_DIR = os.path.join(_THIS_DIR, "saved_models")

AVAILABLE_MODELS = {
    "random_forest": "random_forest.joblib",
    "xgboost": "xgboost.joblib",
}


def model_path(name: str) -> str:
    return os.path.join(SAVED_MODELS_DIR, AVAILABLE_MODELS.get(name, ""))


def is_trained(name: str) -> bool:
    return os.path.exists(model_path(name))


@lru_cache(maxsize=4)
def load_model(name: str = "random_forest") -> dict:
    """Carga el artefacto del modelo (cacheado). Entrena si no existe."""
    if name not in AVAILABLE_MODELS:
        raise ValueError(f"Modelo desconocido: {name}. Opciones: {list(AVAILABLE_MODELS)}")
    path = model_path(name)
    if not os.path.exists(path):
        _train_fallback(name)
    return joblib.load(path)


def _train_fallback(name: str) -> None:
    """Entrena el modelo si falta el artefacto (usa el dataset real)."""
    print(f"[inference] Modelo '{name}' no encontrado. Entrenando ahora...")
    if name == "random_forest":
        from ml import train_random_forest as t
    else:
        from ml import train_xgboost as t
    t.train()


def predict(case: dict, model_name: str = "random_forest") -> Dict:
    """Realiza la inferencia para un caso clínico individual.

    Devuelve diagnóstico estimado, probabilidad y vector de probabilidades
    por clase, junto a la Hbc utilizada.
    """
    artifact = load_model(model_name)
    pipeline = artifact["pipeline"]
    label_encoder = artifact["label_encoder"]

    frame = case_to_frame(case)
    # Hbc ya no es feature del modelo; se calcula aparte para diagnóstico/reporte.
    hbc = case.get("Hbc")
    if hbc in (None, ""):
        hbc = correct_hemoglobin_for_altitude(
            float(case["Hemoglobina"]), float(case["AlturaREN"])
        )
    hbc = float(hbc)

    proba = pipeline.predict_proba(frame)[0]
    pred_idx = int(np.argmax(proba))
    pred_code = label_encoder.inverse_transform([pred_idx])[0]

    class_proba = {
        cls: round(float(p), 4)
        for cls, p in zip(label_encoder.classes_, proba)
    }
    # Reordenar por severidad canónica.
    ordered = {cls: class_proba.get(cls, 0.0) for cls in CLASS_ORDER}

    return {
        "model": model_name,
        "diagnosis_code": pred_code,
        "diagnosis_label": DX_LABELS_ES.get(pred_code, pred_code),
        "probability": round(float(proba[pred_idx]) * 100, 1),
        "class_probabilities": ordered,
        "hbc": hbc,
        "metrics": artifact.get("metrics", {}),
    }


def model_status() -> List[Dict]:
    """Estado de cada modelo (entrenado o no) y sus métricas si existen."""
    status = []
    for name in AVAILABLE_MODELS:
        trained = is_trained(name)
        entry = {"name": name, "trained": trained}
        if trained:
            try:
                art = joblib.load(model_path(name))
                entry["metrics"] = art.get("metrics", {})
                entry["trained_at"] = art.get("trained_at")
            except Exception:  # noqa: BLE001
                entry["trained"] = False
        status.append(entry)
    return status
