"""
ml/train_random_forest.py
================================================================
Entrena un RandomForestClassifier multiclase para estimar la severidad
de la anemia (Normal / Leve / Moderada / Severa) y guarda el modelo,
el codificador de etiquetas y las métricas en `ml/saved_models/`.

Uso:
    python ml/train_random_forest.py                       # train 2024 · test 2025 (default)
    python ml/train_random_forest.py --train data/dataset2024.csv --test data/dataset2025.csv
"""
from __future__ import annotations

import _bootstrap  # noqa: F401  (configura sys.path y rutas)

import argparse
import json
import os
from datetime import datetime, timezone

import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder

from _bootstrap import DATA_TEST, DATA_TRAIN, SAVED_MODELS_DIR
from ml.evaluate_models import print_report
from ml.preprocessing_pipeline import CLASS_ORDER
from ml.training_utils import assemble_metrics, build_smote_pipeline, load_year_split

MODEL_NAME = "random_forest"


def train(train_paths: list[str] = DATA_TRAIN,
          test_paths: list[str] = DATA_TEST,
          random_state: int = 42) -> dict:
    print(f"[RF] Train (2024): {train_paths}")
    print(f"[RF] Test  (2025): {test_paths}")

    label_encoder = LabelEncoder().fit(CLASS_ORDER)
    X_train, X_test, y_train, y_test = load_year_split(
        train_paths, test_paths, label_encoder
    )

    # Sin class_weight: el balanceo lo aporta SMOTE (solo sobre train).
    estimator = RandomForestClassifier(
        n_estimators=300,
        max_depth=None,
        min_samples_leaf=2,
        n_jobs=-1,
        random_state=random_state,
    )
    pipeline = build_smote_pipeline(estimator, random_state=random_state)

    print(f"[RF] Entrenando (SMOTE en train) con {len(X_train)} muestras...")
    pipeline.fit(X_train, y_train)

    metrics = assemble_metrics(pipeline, label_encoder, X_train, y_train, X_test, y_test)
    print_report("Random Forest", metrics)

    artifact = {
        "pipeline": pipeline,
        "label_encoder": label_encoder,
        "classes": list(label_encoder.classes_),
        "metrics": metrics,
        "model_name": MODEL_NAME,
        "trained_at": datetime.now(timezone.utc).isoformat(),
    }
    out_path = os.path.join(SAVED_MODELS_DIR, f"{MODEL_NAME}.joblib")
    joblib.dump(artifact, out_path)
    with open(os.path.join(SAVED_MODELS_DIR, f"{MODEL_NAME}_metrics.json"),
              "w", encoding="utf-8") as fh:
        json.dump(metrics, fh, indent=2, ensure_ascii=False)
    print(f"[RF] Modelo guardado en: {out_path}")
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Entrena RandomForest para AnemIA")
    parser.add_argument(
        "--train", nargs="+", default=DATA_TRAIN,
        help="CSV(s) de entrenamiento (default: dataset2024.csv)",
    )
    parser.add_argument(
        "--test", nargs="+", default=DATA_TEST,
        help="CSV(s) de prueba (default: dataset2025.csv)",
    )
    args = parser.parse_args()
    train(args.train, args.test)
