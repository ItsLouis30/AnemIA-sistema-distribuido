<div align="center">

<img src="docs/assets/anemia-logo.svg" alt="AnemIA" width="120" />

# AnemIA

**Asistente clínico multiagente para el diagnóstico de anemia infantil en zonas altoandinas**

Sistema de apoyo a la decisión clínica que combina **Machine Learning** e **IA explicable (XAI)** para estimar la severidad de anemia infantil en la región de **Puno, Perú**, aplicando la corrección de hemoglobina por altitud (OMS 2024 / RM-258-2020-MINSA).

![React](https://img.shields.io/badge/React-18-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker_Compose-2496ED?logo=docker&logoColor=white)

</div>

> [!WARNING]
> **Prototipo académico.** AnemIA no reemplaza el diagnóstico ni el tratamiento realizado por profesionales de salud. Toda recomendación generada debe ser validada por personal médico autorizado.

## Resumen

En la sierra peruana, la altitud eleva la concentración de hemoglobina y distorsiona la interpretación clínica: un valor "normal" a nivel del mar puede esconder una anemia a 3 800 m.s.n.m. AnemIA aborda este problema con un **pipeline de seis agentes** que valida el caso, corrige la hemoglobina por altitud, predice la severidad con modelos de ML, explica el porqué de la predicción y propone recomendaciones referenciales del MINSA, todo a través de una interfaz conversacional.

## Características

- **Corrección por altitud** — Hemoglobina ajustada (Hbc) con una **fórmula continua** (OMS 2024 / MINSA) calibrada al propio dataset, idéntica en entrenamiento e inferencia.
- **Diagnóstico con ML** — Random Forest y XGBoost para clasificación multiclase (Normal · Leve · Moderada · Severa), con **balanceo SMOTE** sobre el conjunto de entrenamiento.
- **Evaluación rica** — Accuracy, balanced accuracy, F1 macro/weighted, ROC-AUC, PR-AUC, MCC, Cohen's kappa, matriz de confusión y métricas por clase, en train y test.
- **IA explicable (XAI)** — Importancia de factores por caso con SHAP y LIME, no solo el resultado.
- **Recomendaciones con IA (Gemini)** — Un agente analiza el caso y la predicción y genera pautas cortas; si no hay API key o falla, cae a reglas MINSA-CRED.
- **Interfaz conversacional** — SPA tipo chat (React) con formulario clínico, panel de resultados, dashboard de métricas, reporte en PDF e historial local.
- **Arquitectura multiagente auditable** — Cada paso del pipeline registra su estado y tiempos.

## Arquitectura

Tres capas desacopladas, orquestadas con Docker Compose:

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────────────┐
│  Frontend (SPA)     │     │  Backend (API)       │     │  Capa inteligente           │
│  React + TS + TSX   │ ──▶ │  FastAPI + Uvicorn   │ ──▶ │  agents/ · ml/ · explainability/ │
│  Webpack 5 · :3000  │     │  SQLAlchemy · :8000  │     │  scikit-learn · XGBoost · SHAP/LIME │
└─────────────────────┘     └──────────┬───────────┘     └─────────────────────────────┘
                                        │
                                        ▼
                               PostgreSQL (:5432)
```

Detalle en [`docs/architecture.md`](docs/architecture.md).

## Sistema multiagente

El `Orchestrator` ejecuta los agentes de forma secuencial y se detiene ante el primer error crítico; el agente de monitoreo siempre corre al final para cerrar la auditoría.

| # | Agente | Rol |
|---|--------|-----|
| 1 | **Data** (Registro Clínico) | Valida los campos del caso clínico. |
| 2 | **Preprocessing** (Clínico-Contextual) | Calcula la hemoglobina corregida por altitud (Hbc). |
| 3 | **Prediction** (Predictivo ML) | Estima la severidad con Random Forest o XGBoost. |
| 4 | **Explainability** (XAI) | Genera importancias SHAP y LIME del caso. |
| 5 | **Recommendation** (Terapéutico) | Genera recomendaciones con IA (Gemini); fallback a reglas MINSA-CRED. |
| 6 | **Monitoring** (Coordinador) | Audita tiempos, consolida y cierra el reporte unificado. |

Detalle en [`docs/agents.md`](docs/agents.md).

## Primeros pasos

### Requisitos

- [Python 3.11–3.13](https://www.python.org/) (fijado a 3.12) gestionado con [`uv`](https://github.com/astral-sh/uv) + [Node.js 20+](https://nodejs.org/) para el desarrollo local.
- Opcional: [Docker](https://www.docker.com/) y Docker Compose (camino alternativo, ver más abajo).
- Opcional: una **API key de [Google AI Studio](https://aistudio.google.com/app/apikey)** para el agente de recomendaciones (Gemini). Sin ella, el sistema sigue funcionando con reglas MINSA.

### Configuración (`.env`)

El proyecto usa un **único `.env` en la raíz**, leído por el backend (pydantic-settings),
por el agente de recomendaciones (python-dotenv) y por Webpack. Copia la plantilla:

```bash
cp .env.example .env
```

Variables relevantes:

| Variable | Por defecto | Para qué sirve |
|----------|-------------|----------------|
| `DATABASE_URL` | `…@db:5432/anemia_db` | Conexión SQLAlchemy. En **local sin Docker** usa `localhost:5433` (ver nota). |
| `CORS_ORIGINS` | `http://localhost:3000` | Orígenes permitidos para el frontend. |
| `DEFAULT_MODEL` | `random_forest` | Modelo por defecto (`random_forest` \| `xgboost`). |
| `REACT_APP_API_URL` | `http://localhost:8000` | URL del backend que consume el frontend. |
| `GEMINI_API_KEY` | *(vacío)* | API key de Gemini. **Vacío → el agente usa reglas MINSA** (no se rompe nada). |
| `GEMINI_MODELS` | `gemini-3.1-flash-lite,gemini-2.5-flash,gemini-2.5-flash-lite,gemini-3.5-flash` | Cadena de modelos a intentar en orden (degradación automática). |
| `GEMINI_MAX_OUTPUT_TOKENS` | `400` | Límite de tokens de salida (recomendaciones cortas, controla el gasto). |
| `GEMINI_TEMPERATURE` | `0.4` | Creatividad de las recomendaciones. |

> [!WARNING]
> El `.env` real está en `.gitignore` (no se commitea). Si pegas una API key real,
> no la compartas en capturas ni repos públicos; rótala si se filtra. `.env.example`
> va siempre con `GEMINI_API_KEY` vacío.

### Opción A — Local (recomendado)

**1. Entorno Python (con `uv`):**

```bash
uv venv                                  # crea .venv
# Activar el entorno:
.venv\Scripts\activate                   # Windows (PowerShell/CMD)
# source .venv/bin/activate              # Linux/macOS

uv pip install -r requirements.txt       # instala backend + ML + SMOTE + httpx
```

**2. (Opcional) Regenerar el dataset limpio.** El repo ya incluye `data/dataset2024.csv`
limpio; si partes del export crudo de RENIPRESS, ejecútalo de nuevo:

```bash
python ml/etl_clean_dataset.py           # imputa, normaliza y deja el CSV listo (in place)
```

**3. Entrenar los modelos** (requerido la primera vez; genera `ml/saved_models/*.joblib`):

```bash
python ml/train_random_forest.py         # ambos datasets (2024+2025), split 80/20 + SMOTE en train
python ml/train_xgboost.py
python ml/compare_models.py              # opcional: compara y elige el mejor por F1 macro
```

**4. Iniciar la API:**

```bash
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

**5. Frontend (otra terminal):**

```bash
cd frontend
npm install
npm start                                # http://localhost:3000
```

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| API + Swagger | http://localhost:8000/docs |

> [!IMPORTANT]
> **Entrena los modelos antes de iniciar la API.** El backend carga los `.joblib` al
> arrancar; si faltan, `ml/inference.py` los entrena automáticamente en la primera
> predicción (más lento). El dashboard de métricas necesita modelos entrenados.

> [!NOTE]
> **Sin PostgreSQL** la API funciona igual: solo se desactiva la persistencia. Para
> habilitarla en local, ajusta `DATABASE_URL` a `…@localhost:5433/…` y carga el esquema
> con `psql "$DATABASE_URL" -f database/init.sql`.

### Opción B — Docker (alternativa)

```bash
cp .env.example .env
docker compose up --build
```

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| API + Swagger | http://localhost:8000/docs |
| PostgreSQL | `localhost:5433` (mapeado; interno `5432`) |

> [!NOTE]
> En Docker, `docker-compose.yml` carga el `.env` de la raíz en el backend vía `env_file`,
> por lo que el agente de recomendaciones usa **Gemini** si `GEMINI_API_KEY` está definida (si
> no, cae al **fallback MINSA**). No pongas la clave en `docker-compose.yml`: déjala en `.env`.

Comandos completos y guía de prueba manual en [`COMANDOS_EJECUCION.md`](COMANDOS_EJECUCION.md); instalación detallada en [`docs/setup.md`](docs/setup.md).

## API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET`  | `/health` | Estado del servicio. |
| `GET`  | `/models/status` | Estado y **métricas completas** (train/test, matriz de confusión, por clase) de los modelos. |
| `POST` | `/predict` | Predicción de severidad para un caso. |
| `POST` | `/explain/shap` | Explicación SHAP del caso. |
| `POST` | `/explain/lime` | Explicación LIME del caso. |
| `POST` | `/agents/run` | Ejecuta el pipeline multiagente completo. |
| `GET`  | `/agents/logs` | Histórico de ejecuciones de agentes. |
| `GET`  | `/dashboard` | Métricas agregadas para el panel. |

Documentación interactiva en `/docs`; ejemplos en [`docs/api.md`](docs/api.md).

## Dataset

El entrenamiento combina **dos datasets** de RENIPRESS-Puno con el mismo esquema: `data/dataset2025.csv` (2025, curado a mano, ≈ 44 000 filas) y `data/dataset2024.csv` (2024, limpiado por ETL, ≈ 41 000 filas). Al unirlos se eliminan **3 137 duplicados exactos**, quedando **≈ 81 950 registros** para el split. El objetivo es la **clasificación multiclase** de la severidad de anemia (`Dx_anemia`), muy desbalanceada (Normal ≈ 86 % · Severa ≈ 0.13 %).

`data/dataset2024.csv` se obtiene del crudo con `ml/etl_clean_dataset.py`, que **imputa** los vacíos de los programas sociales (`Juntos`/`SIS`/`Qaliwarma`) por moda, normaliza las etiquetas, recorta rangos imposibles y deduplica (el crudo original se respalda en `data/raw/`). La consolidación de ambos datasets y el deduplicado exacto **previo al split** los realiza `load_datasets()` en `ml/preprocessing_pipeline.py`. Hay una muestra de 200 filas en `data/sample/sample_200.csv`. Variables, balanceo y métricas en [`docs/models.md`](docs/models.md).

**Caso de ejemplo (Juliaca):**

```
Sexo F · Edad 53.62 meses · Hb 13.7 g/dL · Altitud 3877 m.s.n.m.
→ Hbc ≈ 11.06 g/dL (ajuste −2.64) → Diagnóstico: Normal (bajo riesgo)
```

## Estructura del repositorio

```
backend/          API FastAPI (core, api, schemas, services, models, utils, tests)
frontend/         SPA React + Webpack (pages, components/dashboard, hooks, services, types)
agents/           6 agentes + orquestador · agents/llm/ (cliente Gemini)
ml/               ETL, preprocesamiento, entrenamiento RF/XGB (SMOTE), evaluación e inferencia
explainability/   SHAP y LIME
database/         schema.sql, seed.sql, migraciones (Alembic)
data/             dataset2025.csv + dataset2024.csv (entrenamiento) · raw/ (crudo) · sample/
notebooks/        EDA, entrenamiento, XAI y demo del pipeline
docs/             documentación técnica
docker-compose.yml · Dockerfile.* · pyproject.toml · requirements.txt · .env(.example)
```

## Tecnologías

**Frontend** — React 18 · TypeScript · Webpack 5 · Tailwind CSS · Framer Motion · React Router · Axios · Recharts · Lucide

**Backend** — FastAPI · Uvicorn · SQLAlchemy · Alembic · PostgreSQL · Pydantic · httpx

**ML / XAI** — scikit-learn · XGBoost · imbalanced-learn (SMOTE) · SHAP · LIME · pandas · NumPy

**IA generativa** — Google Gemini (API REST) para el agente de recomendaciones

**Tooling** — `uv` · Docker Compose

## Notebooks

Exploración y experimentación reproducible en [`notebooks/`](notebooks/):

1. `01_eda.ipynb` — análisis exploratorio
2. `02_training_random_forest.ipynb` — entrenamiento Random Forest
3. `03_training_xgboost.ipynb` — entrenamiento XGBoost
4. `04_shap_lime_explainability.ipynb` — explicabilidad
5. `05_demo_pipeline.ipynb` — demostración del pipeline completo

## Documentación

[Arquitectura](docs/architecture.md) · [Setup](docs/setup.md) · [Base de datos](docs/database.md) · [Docker](docs/docker.md) · [Frontend](docs/frontend.md) · [Agentes](docs/agents.md) · [Modelos](docs/models.md) · [API](docs/api.md)

---

<div align="center">

Proyecto académico · Inteligencia Artificial · Ciclo VII · Ingeniería de Sistemas

</div>
