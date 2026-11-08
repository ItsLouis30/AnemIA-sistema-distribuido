"""
ml/etl_clean_dataset.py
================================================================
ETL de limpieza para el export crudo de RENIPRESS-Puno (`data/dataset2024.csv`).

Toma el CSV crudo (36 columnas, etiquetas con espacios, vacíos en variables de
programas sociales) y produce un CSV limpio con el MISMO esquema de 17 columnas
que `data/dataset.csv` (la versión 2025 curada a mano), listo para entrenar.

Principios:
  * Imputar antes que eliminar. Solo se descartan filas sin objetivo válido o
    sin valores clínicos esenciales irrecuperables.
  * Reutiliza el esquema canónico de `ml/preprocessing_pipeline.py`.

Uso:
    python ml/etl_clean_dataset.py                 # limpia data/dataset2024.csv in place
    python ml/etl_clean_dataset.py --in <ruta> --out <ruta> --no-backup
"""
from __future__ import annotations

import _bootstrap  # noqa: F401  (configura sys.path y rutas)

import argparse
import os
import shutil
import sys

import numpy as np
import pandas as pd

# La consola de Windows usa cp1252; forzamos UTF-8 para los caracteres del reporte.
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:  # noqa: BLE001
    pass

from _bootstrap import REPO_ROOT
from ml.preprocessing_pipeline import (
    BINARY_FEATURES,
    CLASS_ORDER,
    NUMERIC_FEATURES,
    correct_hemoglobin_for_altitude,
)

# Esquema de salida (17 columnas) idéntico a data/dataset.csv.
OUTPUT_COLUMNS = [
    "Prov_EESS", "Dist_EESS", "Sexo", "EdadMeses",
    "Juntos", "SIS", "Qaliwarma", "Cred", "Suplementacion", "Consejeria", "Sesion",
    "Hemoglobina", "ProvinciaREN", "DistritoREN", "AlturaREN", "Hbc", "Dx_anemia",
]
CATEGORICAL_TEXT = ["Prov_EESS", "Dist_EESS", "Sexo", "ProvinciaREN", "DistritoREN"]
NUMERIC_ESSENTIAL = ["EdadMeses", "Hemoglobina", "AlturaREN"]

# Las etiquetas crudas llegan con espacios; el resto del sistema usa camelCase.
LABEL_MAP = {
    "Normal": "Normal",
    "Anemia Leve": "AnemiaLeve",
    "Anemia Moderada": "AnemiaModerada",
    "Anemia Severa": "AnemiaSevera",
    # Idempotencia: si ya viene en camelCase, se respeta.
    **{c: c for c in CLASS_ORDER},
}

# Rangos plausibles para detectar/recortar valores imposibles.
RANGES = {"Hemoglobina": (3.0, 20.0), "AlturaREN": (0.0, 6000.0), "EdadMeses": (0.0, 72.0)}

DEFAULT_PATH = os.path.join(REPO_ROOT, "data", "dataset2024.csv")


def clean(in_path: str, out_path: str, backup: bool = True) -> pd.DataFrame:
    print(f"[ETL] Cargando crudo: {in_path}")
    df = pd.read_csv(in_path, encoding="utf-8-sig", dtype=str)
    df.columns = [c.strip() for c in df.columns]
    n_in = len(df)
    print(f"[ETL] Filas crudas: {n_in}  ·  columnas: {len(df.columns)}")

    if backup:
        backup_dir = os.path.join(REPO_ROOT, "data", "raw")
        os.makedirs(backup_dir, exist_ok=True)
        backup_path = os.path.join(backup_dir, "dataset2024_original.csv")
        if not os.path.exists(backup_path):
            shutil.copy2(in_path, backup_path)
            print(f"[ETL] Backup del crudo en: {backup_path}")
        else:
            print(f"[ETL] Backup ya existe (no se sobrescribe): {backup_path}")

    missing_cols = [c for c in OUTPUT_COLUMNS if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Faltan columnas esperadas en el crudo: {missing_cols}")
    df = df[OUTPUT_COLUMNS].copy()

    # ── Normalizar texto / objetivo ──────────────────────────────────
    for col in CATEGORICAL_TEXT:
        df[col] = df[col].astype(str).str.strip()
    df["Dx_anemia"] = df["Dx_anemia"].astype(str).str.strip().map(LABEL_MAP)
    n_bad_label = df["Dx_anemia"].isna().sum()
    df = df.dropna(subset=["Dx_anemia"])
    if n_bad_label:
        print(f"[ETL] Filas sin etiqueta válida descartadas: {n_bad_label}")

    # ── Coerción numérica ────────────────────────────────────────────
    # Hbc ya no es feature del modelo, pero se conserva en el CSV de salida
    # (diagnóstico/reporte), así que se coerciona a numérico explícitamente.
    for col in NUMERIC_FEATURES + ["Hbc"]:  # EdadMeses, Hemoglobina, AlturaREN, Hbc
        df[col] = pd.to_numeric(df[col].astype(str).str.strip(), errors="coerce")
    for col in BINARY_FEATURES:
        df[col] = pd.to_numeric(df[col].astype(str).str.strip(), errors="coerce")

    # ── Recorte de rangos imposibles (clip, no borrar) ───────────────
    for col, (lo, hi) in RANGES.items():
        before = ((df[col] < lo) | (df[col] > hi)).sum()
        if before:
            print(f"[ETL] {col}: {before} valores fuera de [{lo},{hi}] recortados.")
        df[col] = df[col].clip(lower=lo, upper=hi)

    # ── Imputación (antes de eliminar) ───────────────────────────────
    imputed = {}
    # Binarias (incluye Juntos/SIS/Qaliwarma con ~3201 vacíos): moda.
    for col in BINARY_FEATURES:
        n_na = int(df[col].isna().sum())
        if n_na:
            mode = df[col].mode(dropna=True)
            fill = int(mode.iloc[0]) if not mode.empty else 0
            df[col] = df[col].fillna(fill)
            imputed[col] = (n_na, fill)
    # Numéricas no esenciales (Hbc): recalcular desde Hb+altitud si falta.
    n_hbc_na = int(df["Hbc"].isna().sum())
    if n_hbc_na:
        mask = df["Hbc"].isna()
        df.loc[mask, "Hbc"] = [
            correct_hemoglobin_for_altitude(hb, alt)
            for hb, alt in zip(df.loc[mask, "Hemoglobina"], df.loc[mask, "AlturaREN"])
        ]
        imputed["Hbc"] = (n_hbc_na, "recalculado(Hb,altitud)")
    # Texto categórico: moda.
    for col in CATEGORICAL_TEXT:
        na_mask = df[col].isin(["", "nan", "None"]) | df[col].isna()
        n_na = int(na_mask.sum())
        if n_na:
            fill = df.loc[~na_mask, col].mode().iloc[0]
            df.loc[na_mask, col] = fill
            imputed[col] = (n_na, fill)

    # ── Eliminar solo lo irrecuperable (objetivo o clínicos esenciales)
    n_before = len(df)
    df = df.dropna(subset=NUMERIC_ESSENTIAL)
    n_dropped = n_before - len(df)
    if n_dropped:
        print(f"[ETL] Filas sin valores clínicos esenciales descartadas: {n_dropped}")

    # ── Tipos finales y deduplicado ──────────────────────────────────
    for col in BINARY_FEATURES:
        df[col] = df[col].round().astype(int).clip(0, 1)
    n_dups = int(df.duplicated().sum())
    if n_dups:
        df = df.drop_duplicates().reset_index(drop=True)
        print(f"[ETL] Duplicados exactos eliminados: {n_dups}")
    df = df[OUTPUT_COLUMNS].reset_index(drop=True)

    # ── Reporte ──────────────────────────────────────────────────────
    print("\n[ETL] ── Reporte de imputación ──")
    if imputed:
        for col, (n_na, fill) in imputed.items():
            print(f"   {col:15s}: {n_na} imputados → {fill}")
    else:
        print("   (sin imputaciones)")
    print("\n[ETL] ── Distribución de clases (salida) ──")
    dist = df["Dx_anemia"].value_counts().reindex(CLASS_ORDER).fillna(0).astype(int)
    for cls, n in dist.items():
        print(f"   {cls:15s}: {n:6d}  ({100*n/len(df):.2f}%)")
    print(f"\n[ETL] Filas in={n_in}  →  out={len(df)}")

    df.to_csv(out_path, index=False, encoding="utf-8-sig")
    print(f"[ETL] CSV limpio escrito en: {out_path}")
    return df


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ETL de limpieza para dataset2024.csv")
    parser.add_argument("--in", dest="in_path", default=DEFAULT_PATH, help="CSV crudo de entrada")
    parser.add_argument("--out", dest="out_path", default=None, help="CSV de salida (por defecto, in place)")
    parser.add_argument("--no-backup", action="store_true", help="No crear backup del crudo")
    args = parser.parse_args()
    clean(args.in_path, args.out_path or args.in_path, backup=not args.no_backup)
