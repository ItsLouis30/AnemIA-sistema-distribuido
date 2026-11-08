"""
backend/app/api/routes_explainability.py
================================================================
  POST /explain/shap  — importancia global + local vía SHAP.
  POST /explain/lime  — explicabilidad local vía LIME.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.app.schemas import PredictRequest
from backend.app.services.explainability_service import lime_explanation, shap_explanation

router = APIRouter(prefix="/explain", tags=["explainability"])


@router.post("/shap")
def explain_shap(req: PredictRequest):
    try:
        return shap_explanation(req.case.model_dump(), req.model)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Error SHAP: {exc}")


@router.post("/lime")
def explain_lime(req: PredictRequest):
    try:
        return lime_explanation(req.case.model_dump(), req.model)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Error LIME: {exc}")
