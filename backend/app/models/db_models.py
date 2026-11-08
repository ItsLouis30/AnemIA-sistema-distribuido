"""
backend/app/models/db_models.py
================================================================
Tablas de trazabilidad de AnemIA (Sección 9 del plan):
  patients · evaluations · predictions · explanations ·
  recommendations · agent_logs
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sexo: Mapped[str] = mapped_column(String(1))
    edad_meses: Mapped[float] = mapped_column(Float)
    provincia_ren: Mapped[str] = mapped_column(String(80), nullable=True)
    distrito_ren: Mapped[str] = mapped_column(String(80), nullable=True)
    altura_ren: Mapped[float] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    evaluations: Mapped[list["Evaluation"]] = relationship(back_populates="patient")


class Evaluation(Base):
    __tablename__ = "evaluations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=True)
    prov_eess: Mapped[str] = mapped_column(String(80), nullable=True)
    dist_eess: Mapped[str] = mapped_column(String(80), nullable=True)
    hemoglobina: Mapped[float] = mapped_column(Float)
    altura_ren: Mapped[float] = mapped_column(Float)
    hbc: Mapped[float] = mapped_column(Float)
    adjustment: Mapped[float] = mapped_column(Float)
    juntos: Mapped[bool] = mapped_column(Boolean, default=False)
    sis: Mapped[bool] = mapped_column(Boolean, default=False)
    qaliwarma: Mapped[bool] = mapped_column(Boolean, default=False)
    cred: Mapped[bool] = mapped_column(Boolean, default=False)
    suplementacion: Mapped[bool] = mapped_column(Boolean, default=False)
    consejeria: Mapped[bool] = mapped_column(Boolean, default=False)
    sesion: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    patient: Mapped["Patient"] = relationship(back_populates="evaluations")
    prediction: Mapped["Prediction"] = relationship(back_populates="evaluation", uselist=False)


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    evaluation_id: Mapped[int] = mapped_column(ForeignKey("evaluations.id"), nullable=True)
    model_name: Mapped[str] = mapped_column(String(40))
    diagnosis_code: Mapped[str] = mapped_column(String(40))
    diagnosis_label: Mapped[str] = mapped_column(String(60))
    probability: Mapped[float] = mapped_column(Float)
    class_probabilities: Mapped[str] = mapped_column(Text)  # JSON serializado
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    evaluation: Mapped["Evaluation"] = relationship(back_populates="prediction")


class Explanation(Base):
    __tablename__ = "explanations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    prediction_id: Mapped[int] = mapped_column(ForeignKey("predictions.id"), nullable=True)
    method: Mapped[str] = mapped_column(String(40))   # shap | lime
    payload: Mapped[str] = mapped_column(Text)        # JSON serializado
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    prediction_id: Mapped[int] = mapped_column(ForeignKey("predictions.id"), nullable=True)
    diagnosis_code: Mapped[str] = mapped_column(String(40))
    title: Mapped[str] = mapped_column(String(120))
    items: Mapped[str] = mapped_column(Text)          # JSON serializado
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class AgentLog(Base):
    __tablename__ = "agent_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    run_id: Mapped[str] = mapped_column(String(40), index=True)
    agent: Mapped[str] = mapped_column(String(60))
    status: Mapped[str] = mapped_column(String(20))
    elapsed_ms: Mapped[float] = mapped_column(Float)
    message: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
