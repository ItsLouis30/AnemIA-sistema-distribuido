"""
agents/llm/gemini_client.py
================================================================
Cliente mínimo para la API REST de Google Gemini (Generative Language).

Diseñado para mantener los agentes desacoplados del backend: lee la
configuración directamente del entorno (cargando el `.env` de la raíz si
está disponible) en lugar de importar `backend.app.core.config`.

Característica clave: **cadena de modelos con degradación**. Se intenta cada
modelo de `GEMINI_MODELS` en orden; ante cualquier error (sin API key, HTTP,
cuota, bloqueo de seguridad o respuesta vacía) se pasa al siguiente. Si todos
fallan, devuelve `None` y el agente que lo invoca aplica su propio respaldo.
"""
from __future__ import annotations

import os
from typing import List, Optional, Tuple

import httpx

try:  # Carga el .env de la raíz para poder leer GEMINI_* desde os.environ.
    from dotenv import load_dotenv

    _REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    load_dotenv(os.path.join(_REPO_ROOT, ".env"))
except Exception:  # noqa: BLE001  (dotenv opcional; el entorno puede ya tener las vars)
    pass

_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
_DEFAULT_MODELS = "gemini-3.1-flash-lite,gemini-2.5-flash,gemini-2.5-flash-lite,gemini-3.5-flash"


def _models_from_env() -> List[str]:
    raw = os.environ.get("GEMINI_MODELS", _DEFAULT_MODELS)
    return [m.strip() for m in raw.split(",") if m.strip()]


def is_configured() -> bool:
    """True si hay una API key disponible para invocar Gemini."""
    return bool(os.environ.get("GEMINI_API_KEY", "").strip())


def generate_text(
    prompt: str,
    *,
    system: Optional[str] = None,
    models: Optional[List[str]] = None,
    max_tokens: Optional[int] = None,
    temperature: Optional[float] = None,
    timeout: float = 15.0,
) -> Tuple[Optional[str], Optional[str]]:
    """Genera texto con la cadena de modelos Gemini.

    Devuelve `(texto, modelo_usado)` o `(None, None)` si no hay key o todos los
    modelos fallan.
    """
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None, None

    models = models or _models_from_env()
    max_tokens = max_tokens or int(os.environ.get("GEMINI_MAX_OUTPUT_TOKENS", "400"))
    temperature = (
        temperature if temperature is not None
        else float(os.environ.get("GEMINI_TEMPERATURE", "0.4"))
    )

    body = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "maxOutputTokens": max_tokens,
            "temperature": temperature,
        },
    }
    if system:
        body["systemInstruction"] = {"parts": [{"text": system}]}

    for model in models:
        url = f"{_API_BASE}/{model}:generateContent"
        try:
            resp = httpx.post(
                url, params={"key": api_key}, json=body, timeout=timeout,
            )
            if resp.status_code != 200:
                continue
            data = resp.json()
            candidates = data.get("candidates") or []
            if not candidates:
                continue
            parts = (candidates[0].get("content") or {}).get("parts") or []
            text = "".join(p.get("text", "") for p in parts).strip()
            if text:
                return text, model
        except Exception:  # noqa: BLE001  (red, timeout, parseo → siguiente modelo)
            continue

    return None, None
