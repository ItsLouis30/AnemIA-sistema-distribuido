"""
backend/app/core/database.py
================================================================
Configuración de SQLAlchemy: engine, sesión y `Base` declarativa.
La conexión es tolerante a fallos: si PostgreSQL no está disponible (por
ejemplo, en una demo local sin Docker), el API sigue operativo y solo se
deshabilita la persistencia.
"""
from __future__ import annotations

import logging
from contextlib import contextmanager
from typing import Iterator, Optional

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from backend.app.core.config import get_settings

logger = logging.getLogger("anemia.db")
settings = get_settings()


class Base(DeclarativeBase):
    pass


engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    future=True,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

_db_available: Optional[bool] = None


def db_available() -> bool:
    """Verifica (una vez) si la base de datos responde."""
    global _db_available
    if _db_available is None:
        try:
            with engine.connect() as conn:
                conn.exec_driver_sql("SELECT 1")
            _db_available = True
        except Exception as exc:  # noqa: BLE001
            logger.warning("Base de datos no disponible: %s", exc)
            _db_available = False
    return _db_available


def init_db() -> None:
    """Crea las tablas declaradas si la base de datos está disponible."""
    if not db_available():
        return
    from backend.app import models  # noqa: F401  (registra los modelos)
    Base.metadata.create_all(bind=engine)
    logger.info("Esquema de base de datos verificado/creado.")


def get_db() -> Iterator[Session]:
    """Dependencia FastAPI: provee una sesión de base de datos."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def session_scope() -> Iterator[Session]:
    """Context manager transaccional para uso fuera de las rutas."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
