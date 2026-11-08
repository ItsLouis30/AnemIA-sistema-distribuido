"""
backend/app/utils/preprocessing.py
================================================================
Re-exporta la lógica clínica/preprocesamiento canónica desde
`ml.preprocessing_pipeline` para que el backend la consuma sin duplicarla
(corrección de Hb por altitud y clasificación por cortes OMS).
"""
from ml.preprocessing_pipeline import (  # noqa: F401
    altitude_adjustment,
    case_to_frame,
    classify_anemia,
    correct_hemoglobin_for_altitude,
)
