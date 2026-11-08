"""
backend/app/services/prediction_service.py
================================================================
Servicio de predicción: inferencia para un caso clínico individual.
"""
from __future__ import annotations

from typing import Any, Dict

from ml.inference import predict as ml_predict


def predict_case(case: Dict[str, Any], model_name: str = "random_forest") -> Dict[str, Any]:
    return ml_predict(case, model_name=model_name)
