"""
ml/evaluate_models.py
================================================================
Funciones de evaluación compartidas: cálculo de métricas multiclase
(Accuracy, Balanced Accuracy, F1 macro/weighted, ROC-AUC OvR, PR-AUC,
Cohen's Kappa, MCC, Log-Loss, especificidad por clase y matriz de
confusión) más un reporte legible por consola.
"""
from __future__ import annotations

from typing import Dict, Optional

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    balanced_accuracy_score,
    classification_report,
    cohen_kappa_score,
    confusion_matrix,
    f1_score,
    log_loss,
    matthews_corrcoef,
    roc_auc_score,
)
from sklearn.preprocessing import label_binarize


def _specificity_per_class(cm: np.ndarray) -> Dict[int, float]:
    """Especificidad (TNR) por clase a partir de la matriz de confusión."""
    cm = np.asarray(cm, dtype=float)
    total = cm.sum()
    spec = {}
    for i in range(cm.shape[0]):
        tp = cm[i, i]
        fp = cm[:, i].sum() - tp
        fn = cm[i, :].sum() - tp
        tn = total - tp - fp - fn
        spec[i] = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
    return spec


def compute_metrics(y_true, y_pred, label_encoder, y_proba=None) -> Dict:
    """Devuelve un diccionario serializable con las métricas principales.

    `y_proba` (opcional, forma [n, n_clases] alineada con `label_encoder.classes_`)
    habilita las métricas que requieren probabilidades: ROC-AUC OvR, PR-AUC y
    log-loss. Si no se proporciona, esas métricas quedan en `None`.
    """
    classes = list(label_encoder.classes_)
    labels = list(range(len(classes)))
    report = classification_report(
        y_true, y_pred,
        labels=labels,
        target_names=classes,
        output_dict=True,
        zero_division=0,
    )
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    specificity = _specificity_per_class(cm)

    # Métricas que dependen de las probabilidades (degradan a None si fallan).
    roc_auc_macro_ovr: Optional[float] = None
    pr_auc_macro: Optional[float] = None
    logloss: Optional[float] = None
    if y_proba is not None:
        y_proba = np.asarray(y_proba, dtype=float)
        try:
            roc_auc_macro_ovr = round(float(roc_auc_score(
                y_true, y_proba, multi_class="ovr", average="macro", labels=labels)), 4)
        except Exception:  # noqa: BLE001
            roc_auc_macro_ovr = None
        try:
            y_bin = label_binarize(y_true, classes=labels)
            pr_auc_macro = round(float(average_precision_score(
                y_bin, y_proba, average="macro")), 4)
        except Exception:  # noqa: BLE001
            pr_auc_macro = None
        try:
            logloss = round(float(log_loss(y_true, y_proba, labels=labels)), 4)
        except Exception:  # noqa: BLE001
            logloss = None

    return {
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "balanced_accuracy": round(float(balanced_accuracy_score(y_true, y_pred)), 4),
        "f1_macro": round(float(f1_score(y_true, y_pred, average="macro", zero_division=0)), 4),
        "f1_weighted": round(float(f1_score(y_true, y_pred, average="weighted", zero_division=0)), 4),
        "cohen_kappa": round(float(cohen_kappa_score(y_true, y_pred)), 4),
        "mcc": round(float(matthews_corrcoef(y_true, y_pred)), 4),
        "roc_auc_macro_ovr": roc_auc_macro_ovr,
        "pr_auc_macro": pr_auc_macro,
        "log_loss": logloss,
        "classes": classes,
        "confusion_matrix": cm.tolist(),
        "per_class": {
            cls: {
                "precision": round(report[cls]["precision"], 4),
                "recall": round(report[cls]["recall"], 4),
                "f1": round(report[cls]["f1-score"], 4),
                "specificity": round(specificity[idx], 4),
                "support": int(report[cls]["support"]),
            }
            for idx, cls in enumerate(classes)
        },
        "n_test": int(len(y_true)),
    }


def print_report(title: str, metrics: Dict) -> None:
    line = "-" * 10
    print(f"\n{line} {title} {line}")
    print(f"  Accuracy          : {metrics['accuracy']:.4f}")
    print(f"  Balanced accuracy : {metrics['balanced_accuracy']:.4f}")
    print(f"  F1 (macro)        : {metrics['f1_macro']:.4f}")
    print(f"  F1 (weighted)     : {metrics['f1_weighted']:.4f}")
    print(f"  Cohen's kappa     : {metrics['cohen_kappa']:.4f}")
    print(f"  MCC               : {metrics['mcc']:.4f}")
    if metrics.get("roc_auc_macro_ovr") is not None:
        print(f"  ROC-AUC (OvR macro): {metrics['roc_auc_macro_ovr']:.4f}")
    if metrics.get("pr_auc_macro") is not None:
        print(f"  PR-AUC (macro)    : {metrics['pr_auc_macro']:.4f}")
    if metrics.get("log_loss") is not None:
        print(f"  Log-loss          : {metrics['log_loss']:.4f}")
    print("  Por clase:")
    for cls, m in metrics["per_class"].items():
        print(f"    - {cls:<16} P={m['precision']:.3f} R={m['recall']:.3f} "
              f"F1={m['f1']:.3f} Esp={m['specificity']:.3f} (n={m['support']})")
    print("-" * 30 + "\n")
