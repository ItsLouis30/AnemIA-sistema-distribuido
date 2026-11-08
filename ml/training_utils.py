"""
ml/training_utils.py
================================================================
Utilidades compartidas por los scripts de entrenamiento (RF y XGBoost):
construcción del pipeline con SMOTE, conteo de clases y ensamblado del
bloque de métricas (train + test + distribución + split) que se guarda en
el artefacto y en el JSON consumido por el dashboard.
"""
from __future__ import annotations

from typing import Dict, List, Tuple

import numpy as np
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline

from ml.evaluate_models import compute_metrics
from ml.preprocessing_pipeline import (
    FEATURE_COLUMNS,
    TARGET,
    build_preprocessor,
    load_datasets,
    split_xy,
)


def load_year_split(train_paths: List[str], test_paths: List[str],
                    label_encoder) -> Tuple:
    """Carga el split temporal: `train_paths` (2024) y `test_paths` (2025).

    Cada conjunto pasa por `load_datasets()` (misma limpieza y deduplicado
    exacto interno). Además se aplica un guardado ANTI-FUGA: se eliminan del
    TEST las filas cuyo vector (features + etiqueta) sea idéntico a una fila del
    TRAIN, de modo que la evaluación entre años no premie memorizar casos que se
    repiten en ambos exports.

    Devuelve `(X_train, X_test, y_train, y_test)` con las etiquetas ya
    codificadas por `label_encoder`.
    """
    df_train = load_datasets(train_paths)
    df_test = load_datasets(test_paths)

    key_cols = FEATURE_COLUMNS + [TARGET]
    before = len(df_test)
    train_keys = set(map(tuple, df_train[key_cols].itertuples(index=False, name=None)))
    keep = [row not in train_keys
            for row in df_test[key_cols].itertuples(index=False, name=None)]
    df_test = df_test[keep].reset_index(drop=True)
    print(
        f"[split] Temporal 2024→2025 · test {before} -> {len(df_test)} filas "
        f"({before - len(df_test)} solapadas con train eliminadas)"
    )

    X_train, y_train_raw = split_xy(df_train)
    X_test, y_test_raw = split_xy(df_test)
    y_train = label_encoder.transform(y_train_raw)
    y_test = label_encoder.transform(y_test_raw)
    return X_train, X_test, y_train, y_test


def build_smote_pipeline(estimator, random_state: int = 42) -> ImbPipeline:
    """Pipeline imbalanced-learn: preprocesado → SMOTE → estimador.

    SMOTE solo actúa al ajustar (fit); en predict/predict_proba el sampler se
    omite, por lo que el conjunto de prueba nunca se resamplea.
    """
    return ImbPipeline([
        ("preprocessor", build_preprocessor()),
        ("smote", SMOTE(random_state=random_state)),
        ("model", estimator),
    ])


def class_counts(y_encoded, label_encoder) -> Dict[str, int]:
    """Conteo de muestras por clase (etiquetas legibles) de un vector codificado."""
    vals, counts = np.unique(np.asarray(y_encoded), return_counts=True)
    names = label_encoder.inverse_transform(vals.astype(int))
    return {str(name): int(n) for name, n in zip(names, counts)}


def assemble_metrics(pipeline, label_encoder,
                     X_train, y_train, X_test, y_test,
                     strategy: str = "Split temporal (train 2024 · test 2025)") -> Dict:
    """Evalúa en train (sin resamplear) y test, y arma el bloque de métricas.

    Mantiene en el nivel superior las claves `accuracy`/`f1_macro`/… del set de
    prueba (compatibilidad con el dashboard actual) y añade los sub-bloques
    `test`, `train`, `class_distribution` y `split`.
    """
    test_metrics = compute_metrics(
        y_test, pipeline.predict(X_test), label_encoder, pipeline.predict_proba(X_test))
    train_metrics = compute_metrics(
        y_train, pipeline.predict(X_train), label_encoder, pipeline.predict_proba(X_train))

    raw = class_counts(y_train, label_encoder)
    majority = max(raw.values()) if raw else 0
    after_smote = {cls: majority for cls in raw}  # SMOTE 'auto' iguala a la mayoritaria

    return {
        **test_metrics,  # accuracy/f1_macro/... del test en el nivel superior (compat)
        "test": test_metrics,
        "train": train_metrics,
        "class_distribution": {"raw_train": raw, "after_smote": after_smote},
        "split": {
            "strategy": strategy,
            "test_size": round(len(X_test) / (len(X_train) + len(X_test)), 3),
            "n_train": int(len(X_train)),
            "n_test": int(len(X_test)),
            "balancing": "SMOTE (solo train)",
        },
    }
