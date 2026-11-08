"""
backend/app/api/routes_prediction.py
================================================================
  POST /predict — inferencia del modelo seleccionado para un caso clínico.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.app.schemas import PredictionResponse, PredictRequest
from backend.app.services.prediction_service import predict_case

router = APIRouter(tags=["prediction"])


@router.post("/predict", response_model=PredictionResponse)
def predict(req: PredictRequest):
    try:
        result = predict_case(req.case.model_dump(), model_name=req.model)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Error de inferencia: {exc}")
    return PredictionResponse(
        model=result["model"],
        diagnosis_code=result["diagnosis_code"],
        diagnosis_label=result["diagnosis_label"],
        probability=result["probability"],
        class_probabilities=result["class_probabilities"],
        hbc=result["hbc"],
    )
