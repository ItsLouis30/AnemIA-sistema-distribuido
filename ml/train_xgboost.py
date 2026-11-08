"""
ml/train_xgboost.py
================================================================
Entrena un XGBClassifier multiclase para la severidad de anemia y guarda
el artefacto en `ml/saved_models/`.

Uso:
    python ml/train_xgboost.py                       # train 2024 · test 2025 (default)
    python ml/train_xgboost.py --train data/dataset2024.csv --test data/dataset2025.csv
"""
from __future__ import annotations

import _bootstrap  # noqa: F401

import argparse
import json
import os
from datetime import datetime, timezone

import joblib
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier

from _bootstrap import DATA_TEST, DATA_TRAIN, SAVED_MODELS_DIR
from ml.evaluate_models import print_report
from ml.preprocessing_pipeline import CLASS_ORDER
from ml.training_utils import assemble_metrics, build_smote_pipeline, load_year_split

MODEL_NAME = "xgboost"


def train(train_paths: list[str] = DATA_TRAIN,
          test_paths: list[str] = DATA_TEST,
          random_state: int = 42) -> dict:
    print(f"[XGB] Train (2024): {train_paths}")
    print(f"[XGB] Test  (2025): {test_paths}")

    label_encoder = LabelEncoder().fit(CLASS_ORDER)
    X_train, X_test, y_train, y_test = load_year_split(
        train_paths, test_paths, label_encoder
    )

    # Sin sample_weight: el balanceo lo aporta SMOTE (solo sobre train), dentro
    # del pipeline imbalanced-learn (preprocesado → SMOTE → estimador).
    estimator = XGBClassifier(
        n_estimators=400,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="multi:softprob",
        num_class=len(CLASS_ORDER),
        eval_metric="mlogloss",
        tree_method="hist",
        random_state=random_state,
    )
    pipeline = build_smote_pipeline(estimator, random_state=random_state)

    print(f"[XGB] Entrenando (SMOTE en train) con {len(X_train)} muestras...")
    pipeline.fit(X_train, y_train)

    metrics = assemble_metrics(pipeline, label_encoder, X_train, y_train, X_test, y_test)
    print_report("XGBoost", metrics)

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
    print(f"[XGB] Modelo guardado en: {out_path}")
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Entrena XGBoost para AnemIA")
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
