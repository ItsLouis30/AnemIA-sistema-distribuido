# Modelos de ML · AnemIA

## Problema
Clasificación **multiclase** de severidad de anemia a partir de los datos reales
(≈ 82k registros combinados de 2024 + 2025, Puno): `Normal · AnemiaLeve ·
AnemiaModerada · AnemiaSevera` (distribución muy desbalanceada).

## Features (`ml/preprocessing_pipeline.py`)
- **Numéricas** (escaladas): `EdadMeses`, `Hemoglobina`, `AlturaREN`, `Hbc`.
- **Binarias** (passthrough): `Juntos`, `SIS`, `Qaliwarma`, `Cred`,
  `Suplementacion`, `Consejeria`, `Sesion`.
- **Categóricas** (one-hot): `Sexo`, `ProvinciaREN`.

`Hbc` se deriva de `Hemoglobina` y `AlturaREN` mediante una **corrección
continua por altitud** (OMS 2024 / MINSA): `adj(h) = -0.030·h² - 0.56384·h`
con `h = altitud/1000`. La fórmula se ajustó por mínimos cuadrados al propio
dataset (error < 1e-6 g/dL), de modo que el `Hbc` de entrenamiento e
inferencia coinciden (sin train/serve skew).

## Datos
El entrenamiento combina **dos datasets** con el mismo esquema:
`data/dataset2025.csv` (curado a mano) y `data/dataset2024.csv` (limpiado por
`ml/etl_clean_dataset.py`: imputación de programas sociales por moda,
normalización de etiquetas, deduplicado). `load_datasets()`
(`ml/preprocessing_pipeline.py`) los une y elimina los **duplicados exactos**
(≈ 3 100) **antes del split**, quedando ≈ 81 950 filas. Distribución muy
desbalanceada (Normal ≈ 86 %, Severa ≈ 0.13 %).

## Modelos
| Modelo | Script | Configuración clave |
|--------|--------|---------------------|
| Random Forest | `train_random_forest.py` | 300 árboles; split 80/20 estratificado + **SMOTE solo en train**. |
| XGBoost | `train_xgboost.py` | 400 árboles, `multi:softprob`; split 80/20 + **SMOTE solo en train**. |

El balanceo se realiza con un `imblearn.pipeline.Pipeline`
(`preprocesado → SMOTE → estimador`); el conjunto de prueba **nunca** se
resamplea. Ambos se serializan con `joblib` en `ml/saved_models/` junto a su
`LabelEncoder` y el bloque de métricas.

## Evaluación
`evaluate_models.py` calcula, sobre **train y test**: Accuracy, Balanced
Accuracy, F1 macro/weighted, Cohen's Kappa, MCC, ROC-AUC (OvR macro), PR-AUC,
Log-loss, precisión/recall/F1/especificidad por clase y matriz de confusión.
`compare_models.py` selecciona el mejor por F1 macro.

> Por el desbalance y porque `Dx_anemia` es cuasi-determinista en `Hbc`, la
> accuracy es muy alta; usa **Balanced Accuracy, MCC y el recall por clase**
> (en especial de `AnemiaSevera`) para una lectura honesta del rendimiento.

Las métricas (incluida la matriz de confusión y la distribución antes/después
de SMOTE) se exponen en `GET /models/status` y se visualizan en el dashboard.

## Inferencia
```python
from ml.inference import predict
predict(case, model_name="random_forest")
```
Si falta el artefacto, `inference.py` entrena el modelo automáticamente.
