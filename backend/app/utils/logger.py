"""
backend/app/utils/logger.py
================================================================
Configuración centralizada de logging para el backend de AnemIA.
"""
from __future__ import annotations

import logging
import sys

_CONFIGURED = False


def setup_logging(level: int = logging.INFO) -> None:
    """Configura el logging raíz una sola vez (idempotente)."""
    global _CONFIGURED
    if _CONFIGURED:
        return
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter("%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
                          datefmt="%H:%M:%S")
    )
    root = logging.getLogger()
    root.setLevel(level)
    root.addHandler(handler)
    _CONFIGURED = True


def get_logger(name: str) -> logging.Logger:
    """Devuelve un logger con el namespace de AnemIA."""
    setup_logging()
    return logging.getLogger(f"anemia.{name}")
