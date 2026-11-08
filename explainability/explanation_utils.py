"""
explainability/explanation_utils.py
================================================================
Utilidades compartidas por los explicadores SHAP y LIME:
  * Obtención de nombres legibles de features tras el ColumnTransformer.
  * Mapeo de features one-hot a su variable original.
  * Normalización de pesos a una escala 0-1 para graficar en el frontend.
"""
from __future__ import annotations

from typing import Dict, List

import numpy as np

# Nombres legibles en español para las variables originales del dataset.
READABLE_NAMES = {
    "EdadMeses": "Edad (meses)",
    "Hemoglobina": "Hemoglobina observada",
    "AlturaREN": "Altitud de residencia",
    "Hbc": "Hemoglobina ajustada (Hbc)",
    "Juntos": "Programa Juntos",
    "SIS": "Seguro SIS",
    "Qaliwarma": "Qali Warma",
    "Cred": "Control CRED",
    "Suplementacion": "Suplementación de hierro",
    "Consejeria": "Consejería nutricional",
    "Sesion": "Sesión demostrativa",
    "Sexo": "Sexo",
    "ProvinciaREN": "Provincia de residencia",
}


def get_feature_names(preprocessor) -> List[str]:
    """Nombres de columnas que produce el ColumnTransformer ya ajustado."""
    try:
        return list(preprocessor.get_feature_names_out())
    except Exception:  # noqa: BLE001
        return []


def base_variable(feature_name: str) -> str:
    """Reduce un nombre transformado (p.ej. 'cat__Sexo_F') a su variable base."""
    name = feature_name.split("__", 1)[-1]
    for original in READABLE_NAMES:
        if name.startswith(original):
            return original
    return name


def aggregate_by_variable(feature_names: List[str], weights: np.ndarray) -> Dict[str, float]:
    """Suma los pesos (en valor absoluto) de columnas one-hot que pertenecen
    a la misma variable original."""
    agg: Dict[str, float] = {}
    for fname, w in zip(feature_names, weights):
        var = base_variable(fname)
        agg[var] = agg.get(var, 0.0) + abs(float(w))
    return agg


def to_frontend_payload(agg: Dict[str, float], top_k: int = 6) -> List[Dict]:
    """Convierte el diccionario agregado en una lista ordenada y normalizada
    lista para Recharts: [{feature, label, weight, weight_norm}]."""
    items = sorted(agg.items(), key=lambda kv: kv[1], reverse=True)[:top_k]
    if not items:
        return []
    max_w = max(w for _, w in items) or 1.0
    return [
        {
            "feature": var,
            "label": READABLE_NAMES.get(var, var),
            "weight": round(w, 4),
            "weight_norm": round(w / max_w, 4),
        }
        for var, w in items
    ]
