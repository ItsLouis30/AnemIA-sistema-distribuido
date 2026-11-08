"""
ml/preprocessing_pipeline.py
================================================================
Núcleo clínico-contextual y de preprocesamiento de AnemIA.

Es la ÚNICA fuente de verdad para:
  * La corrección de hemoglobina por altitud (OMS 2024 / RM-258-2020-MINSA).
  * La clasificación diagnóstica por puntos de corte OMS.
  * El esquema de features y el `ColumnTransformer` de scikit-learn.

El backend (FastAPI), los agentes y los scripts de entrenamiento importan
desde aquí para evitar duplicar la lógica.
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from typing import List, Tuple

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

# ── Esquema de columnas del dataset real ────────────────────────────
TARGET = "Dx_anemia"

# Orden canónico de clases (de menor a mayor severidad).
CLASS_ORDER = ["Normal", "AnemiaLeve", "AnemiaModerada", "AnemiaSevera"]

# Nota: `Hbc` (hemoglobina corregida) se EXCLUYE a propósito del set de features.
# El objetivo `Dx_anemia` se deriva determinísticamente de `Hbc` y `EdadMeses`
# (ver `classify_anemia`), por lo que usar Hbc como predictor es fuga directa de
# la etiqueta. El modelo aprende de la Hb observada + altitud + edad + contexto,
# y puede reconstruir la señal de Hbc por sí mismo (Hbc = Hb + ajuste(altitud)).
NUMERIC_FEATURES = ["EdadMeses", "Hemoglobina", "AlturaREN"]
BINARY_FEATURES = [
    "Juntos", "SIS", "Qaliwarma", "Cred",
    "Suplementacion", "Consejeria", "Sesion",
]
CATEGORICAL_FEATURES = ["Sexo", "ProvinciaREN"]

FEATURE_COLUMNS = NUMERIC_FEATURES + BINARY_FEATURES + CATEGORICAL_FEATURES

# Etiquetas legibles para el frontend / reportes.
DX_LABELS_ES = {
    "Normal": "Normal",
    "AnemiaLeve": "Anemia Leve",
    "AnemiaModerada": "Anemia Moderada",
    "AnemiaSevera": "Anemia Severa",
}


# ════════════════════════════════════════════════════════════════════
#  1. Corrección de hemoglobina por altitud (OMS 2024 / MINSA)
# ════════════════════════════════════════════════════════════════════
# Fórmula CONTINUA de ajuste por altitud, derivada por mínimos cuadrados
# del propio dataset (RENIPRESS-Puno): el ajuste reproduce exactamente
# `Hbc - Hemoglobina` con error < 1e-6 g/dL. Sustituye a la antigua tabla
# escalonada. Aunque Hbc ya no es feature del modelo, se sigue usando para el
# diagnóstico clínico por reglas (`classify_anemia`) y para reportarla en la
# respuesta de inferencia.
#
#   adj(h) = A·h² + B·h ,  con h = altitud_m / 1000  (km)
#
_ALT_COEF_QUAD = -0.030       # A · h²
_ALT_COEF_LIN = -0.56384      # B · h


def altitude_adjustment(altitude_m: float) -> float:
    """Ajuste (negativo, g/dL) que se suma a la Hb observada según la altitud.

    Función continua y monótona: 0 a nivel del mar y cada vez más negativa
    con la altitud. Coincide con la corrección usada para generar `Hbc` en
    el dataset de entrenamiento.
    """
    if altitude_m is None or altitude_m <= 0:
        return 0.0
    h = altitude_m / 1000.0
    return _ALT_COEF_QUAD * h * h + _ALT_COEF_LIN * h


def correct_hemoglobin_for_altitude(hb: float, altitude_m: float) -> float:
    """Devuelve la hemoglobina corregida (Hbc) redondeada a 2 decimales."""
    return round(hb + altitude_adjustment(altitude_m), 2)


# ════════════════════════════════════════════════════════════════════
#  2. Clasificación diagnóstica por puntos de corte OMS
# ════════════════════════════════════════════════════════════════════
@dataclass
class Diagnosis:
    code: str          # 'Normal' | 'AnemiaLeve' | 'AnemiaModerada' | 'AnemiaSevera'
    label: str         # texto legible en español
    severity: str      # Ninguna | Leve | Moderada | Severa
    risk: str          # Bajo | Moderado | Alto | Muy alto
    risk_pct: int      # posición del gauge de riesgo (0-100)


_RISK_BY_CODE = {
    "Normal": ("Ninguna", "Bajo", 10),
    "AnemiaLeve": ("Leve", "Moderado", 45),
    "AnemiaModerada": ("Moderada", "Alto", 72),
    "AnemiaSevera": ("Severa", "Muy alto", 95),
}


def classify_anemia(hbc: float, edad_meses: float) -> Diagnosis:
    """Clasifica según Hbc y edad usando los cortes OMS por grupo etario."""
    if edad_meses < 60:          # < 5 años
        normal, leve, moderada = 11.0, 10.0, 7.0
    else:                        # 5 - 11 años
        normal, leve, moderada = 11.5, 11.0, 8.0

    if hbc >= normal:
        code = "Normal"
    elif hbc >= leve:
        code = "AnemiaLeve"
    elif hbc >= moderada:
        code = "AnemiaModerada"
    else:
        code = "AnemiaSevera"

    severity, risk, pct = _RISK_BY_CODE[code]
    return Diagnosis(code, DX_LABELS_ES[code], severity, risk, pct)


# ════════════════════════════════════════════════════════════════════
#  3. Carga y preparación del dataset
# ════════════════════════════════════════════════════════════════════
def load_dataset(path: str) -> pd.DataFrame:
    """Carga el CSV real, normaliza tipos y elimina filas inválidas."""
    df = pd.read_csv(path, encoding="utf-8-sig")
    df.columns = [c.strip() for c in df.columns]
    df = df.dropna(subset=[TARGET] + NUMERIC_FEATURES)
    for col in BINARY_FEATURES:
        df[col] = df[col].fillna(0).astype(int)
    df = df[df[TARGET].isin(CLASS_ORDER)].reset_index(drop=True)
    return df


def load_datasets(paths: List[str]) -> pd.DataFrame:
    """Carga y concatena varios CSV con el mismo esquema en un único DataFrame.

    Cada archivo pasa primero por `load_dataset()` (misma validación y
    normalización), luego se consolidan y se eliminan los duplicados EXACTOS
    entre archivos. El deduplicado se hace UNA sola vez sobre el consolidado,
    antes del `train_test_split`, para que una misma observación no pueda caer
    a la vez en train y en test (fuga de datos).

    Se añade una columna auxiliar `_source` para trazabilidad en logs; no entra
    como feature porque `split_xy()` y el `ColumnTransformer` seleccionan
    columnas explícitamente vía `FEATURE_COLUMNS`.
    """
    frames = []
    for p in paths:
        df = load_dataset(p)
        df["_source"] = os.path.basename(p)
        frames.append(df)
    combined = pd.concat(frames, ignore_index=True)

    before = len(combined)
    real_cols = [c for c in combined.columns if c != "_source"]
    combined = combined.drop_duplicates(subset=real_cols).reset_index(drop=True)
    print(
        f"[load] {len(paths)} datasets -> {before} filas, "
        f"{before - len(combined)} duplicados exactos eliminados -> {len(combined)}"
    )
    return combined


def split_xy(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
    """Separa la matriz de features X y el vector objetivo y."""
    X = df[FEATURE_COLUMNS].copy()
    y = df[TARGET].copy()
    return X, y


def build_preprocessor() -> ColumnTransformer:
    """`ColumnTransformer`: escala numéricas, one-hot categóricas, pasa binarias."""
    return ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_FEATURES),
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CATEGORICAL_FEATURES,
            ),
            ("bin", "passthrough", BINARY_FEATURES),
        ],
        remainder="drop",
    )


def make_pipeline(estimator) -> Pipeline:
    """Encapsula preprocesamiento + estimador en un único `Pipeline`."""
    return Pipeline([("preprocessor", build_preprocessor()), ("model", estimator)])


def case_to_frame(case: dict) -> pd.DataFrame:
    """Convierte un caso clínico (dict) en un DataFrame de una fila con el
    esquema de features esperado por el pipeline.

    `Hbc` ya no forma parte de `FEATURE_COLUMNS`, así que no se calcula aquí; la
    Hbc para diagnóstico/reporte se obtiene aparte vía
    `correct_hemoglobin_for_altitude` en la capa de inferencia.
    """
    record = dict(case)
    if "ProvinciaREN" not in record:
        record["ProvinciaREN"] = "DESCONOCIDA"
    row = {col: record.get(col) for col in FEATURE_COLUMNS}
    return pd.DataFrame([row], columns=FEATURE_COLUMNS)
