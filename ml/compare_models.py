"""
ml/compare_models.py
================================================================
Entrena (si es necesario) y compara Random Forest vs XGBoost, imprimiendo
una tabla resumen y guardando `ml/saved_models/comparison.json`.

Uso:
    python ml/compare_models.py
"""
from __future__ import annotations

import _bootstrap  # noqa: F401

import json
import os

import joblib

from _bootstrap import SAVED_MODELS_DIR
from ml import train_random_forest, train_xgboost


def _load_or_train(name: str, trainer) -> dict:
    path = os.path.join(SAVED_MODELS_DIR, f"{name}.joblib")
    if os.path.exists(path):
        print(f"[compare] Usando modelo existente: {name}")
        return joblib.load(path)["metrics"]
    print(f"[compare] Entrenando modelo faltante: {name}")
    return trainer.train()


def main() -> None:
    rf = _load_or_train("random_forest", train_random_forest)
    xgb = _load_or_train("xgboost", train_xgboost)

    rows = [("Random Forest", rf), ("XGBoost", xgb)]
    print("\n=========== COMPARACIÓN DE MODELOS ===========")
    print(f"{'Modelo':<16}{'Accuracy':>10}{'F1 macro':>12}{'F1 weighted':>14}")
    for name, m in rows:
        print(f"{name:<16}{m['accuracy']:>10.4f}{m['f1_macro']:>12.4f}{m['f1_weighted']:>14.4f}")
    print("==============================================\n")

    best = max(rows, key=lambda r: r[1]["f1_macro"])
    summary = {
        "random_forest": rf,
        "xgboost": xgb,
        "best_by_f1_macro": best[0],
    }
    out = os.path.join(SAVED_MODELS_DIR, "comparison.json")
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(summary, fh, indent=2, ensure_ascii=False)
    print(f"[compare] Mejor modelo (F1 macro): {best[0]}")
    print(f"[compare] Resumen guardado en: {out}")


if __name__ == "__main__":
    main()
