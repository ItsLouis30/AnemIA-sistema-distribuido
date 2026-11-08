"""
backend/app/schemas/prediction_schema.py
================================================================
Esquemas de entrada/salida para predicción y estado de modelos.
Los campos del caso clínico coinciden con las columnas del dataset real.
"""
from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field

ModelName = Literal["random_forest", "xgboost"]


class CaseInput(BaseModel):
    """Caso clínico de entrada (datos de un niño/a)."""
    Prov_EESS: Optional[str] = Field(default=None, description="Provincia del EESS")
    Dist_EESS: Optional[str] = Field(default=None, description="Distrito del EESS")
    Sexo: Literal["F", "M"] = "F"
    EdadMeses: float = Field(..., gt=0, le=180)
    Juntos: int = 0
    SIS: int = 0
    Qaliwarma: int = 0
    Cred: int = 0
    Suplementacion: int = 0
    Consejeria: int = 0
    Sesion: int = 0
    Hemoglobina: float = Field(..., gt=0, le=25)
    ProvinciaREN: Optional[str] = Field(default="DESCONOCIDA")
    DistritoREN: Optional[str] = None
    AlturaREN: float = Field(..., gt=0, le=6000)

    model_config = {
        "json_schema_extra": {
            "example": {
                "Prov_EESS": "SANROMAN", "Dist_EESS": "JULIACA",
                "Sexo": "F", "EdadMeses": 53.62,
                "Juntos": 0, "SIS": 1, "Qaliwarma": 0, "Cred": 1,
                "Suplementacion": 1, "Consejeria": 0, "Sesion": 0,
                "Hemoglobina": 13.7,
                "ProvinciaREN": "SANROMAN", "DistritoREN": "JULIACA",
                "AlturaREN": 3877,
            }
        }
    }


class PredictRequest(BaseModel):
    case: CaseInput
    model: ModelName = "random_forest"


class PredictionResponse(BaseModel):
    model: str
    diagnosis_code: str
    diagnosis_label: str
    probability: float
    class_probabilities: Dict[str, float]
    hbc: float


class ModelStatus(BaseModel):
    name: str
    trained: bool
    metrics: Optional[Dict[str, Any]] = None
    trained_at: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    app: str
    environment: str
    database: str
    models: List[ModelStatus]
