"""
backend/app/services/model_loader.py
================================================================
Servicio de carga de modelos: expone el estado y delega la carga
perezosa/cacheada en `ml.inference`.
"""
from __future__ import annotations

from typing import Dict, List

from ml.inference import is_trained, load_model, model_status


def get_model(name: str = "random_forest") -> dict:
    return load_model(name)


def get_status() -> List[Dict]:
    return model_status()


def ensure_trained(name: str = "random_forest") -> bool:
    if not is_trained(name):
        load_model(name)  # dispara el entrenamiento de respaldo
    return is_trained(name)
