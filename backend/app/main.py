"""
backend/app/main.py
================================================================
Punto de entrada de la API FastAPI de AnemIA.

Ejecución local (desde la raíz del repo):
    uvicorn backend.app.main:app --reload --port 8000
o bien:
    cd backend && uvicorn app.main:app --reload --port 8000
"""
from __future__ import annotations

# Garantiza que la raíz del repo esté en sys.path (paquetes ml/agents/...).
import backend.app  # noqa: F401

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api import (
    routes_agents,
    routes_dashboard,
    routes_explainability,
    routes_health,
    routes_prediction,
)
from backend.app.core.config import get_settings
from backend.app.core.database import init_db
from backend.app.api import routes_chat

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("anemia")
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Iniciando %s (%s)", settings.app_name, settings.environment)
    try:
        init_db()
    except Exception as exc:  # noqa: BLE001
        logger.warning("init_db() falló (la API seguirá sin persistencia): %s", exc)
    yield
    logger.info("Apagando %s", settings.app_name)


app = FastAPI(
    title=settings.app_name,
    description="Sistema multiagente con ML y XAI para anemia infantil en Puno, Perú.",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_health.router)
app.include_router(routes_prediction.router)
app.include_router(routes_explainability.router)
app.include_router(routes_agents.router)
app.include_router(routes_chat.router)
app.include_router(routes_dashboard.router)


@app.get("/", tags=["root"])
def root():
    return {
        "app": settings.app_name,
        "version": "2.0.0",
        "docs": "/docs",
        "endpoints": [
            "/health", "/models/status", "/predict",
            "/explain/shap", "/explain/lime",
            "/agents/run", "/agents/logs", "/dashboard",
        ],
    }
