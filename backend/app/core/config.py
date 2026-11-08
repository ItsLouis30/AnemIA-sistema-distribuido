"""
backend/app/core/config.py
================================================================
Configuración central de la aplicación basada en variables de entorno
(pydantic-settings). Lee el archivo `.env` de la raíz del proyecto.
"""
from __future__ import annotations

import os
from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_REPO_ROOT = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(_REPO_ROOT, ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Aplicación
    app_name: str = "AnemIA API"
    environment: str = "development"
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    # Base de datos
    database_url: str = "postgresql+psycopg2://anemia:anemia_secret@localhost:5432/anemia_db"

    @field_validator("database_url")
    @classmethod
    def _normalize_db_url(cls, v: str) -> str:
        # Proveedores gestionados (Railway, Heroku…) entregan el esquema
        # `postgres://`, que SQLAlchemy 2.0 ya no acepta. Lo normalizamos a
        # `postgresql://` (psycopg2 es el driver por defecto). El formato local
        # `postgresql+psycopg2://` no empieza por ese prefijo, así que queda
        # intacto.
        if v.startswith("postgres://"):
            return "postgresql://" + v[len("postgres://") :]
        return v

    # CORS (cadena separada por comas en el .env)
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # Modelo por defecto
    default_model: str = "random_forest"

    # Agente de recomendaciones (Gemini). La cadena de modelos se intenta en
    # orden; si todos fallan o no hay API key, el agente cae a reglas MINSA.
    gemini_api_key: str = ""
    gemini_models: str = (
        "gemini-3.1-flash-lite,gemini-2.5-flash,gemini-2.5-flash-lite,gemini-3.5-flash"
    )
    gemini_max_output_tokens: int = 400
    gemini_temperature: float = 0.4

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
