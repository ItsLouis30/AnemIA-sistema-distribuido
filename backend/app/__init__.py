"""Aplicación FastAPI de AnemIA.

Bootstrap de import: añade la raíz del repositorio a sys.path para que los
paquetes hermanos `ml`, `agents` y `explainability` sean importables tanto
si se ejecuta `uvicorn backend.app.main:app` desde la raíz como
`cd backend && uvicorn app.main:app`.
"""
import os
import sys

_REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)
