# Arquitectura · AnemIA

Sistema de tres capas para el diagnóstico asistido de anemia infantil en Puno.

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React + TypeScript + TSX + Webpack 5 + Tailwind) │
│  Páginas: Home · Prediction · Explainability · Agents ·      │
│           Dashboard · NotFound   (mobile-first)              │
└───────────────┬─────────────────────────────────────────────┘
                │ HTTP/JSON (Axios) · REACT_APP_API_URL
┌───────────────▼─────────────────────────────────────────────┐
│  Backend (FastAPI)                                           │
│  /predict /explain/* /agents/* /dashboard /health           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Capa inteligente (Sistema Multiagente)              │   │
│  │  Orchestrator → Data → Preprocessing → Prediction →  │   │
│  │  Explainability → Recommendation → Monitoring        │   │
│  └──────────┬───────────────┬───────────────┬───────────┘   │
│             │               │               │               │
│        ml/ (RF, XGB)   explainability/   utils clínicos      │
│                         (SHAP, LIME)                         │
└───────────────┬─────────────────────────────────────────────┘
                │ SQLAlchemy
┌───────────────▼─────────────────────────────────────────────┐
│  PostgreSQL: patients · evaluations · predictions ·          │
│              explanations · recommendations · agent_logs     │
└─────────────────────────────────────────────────────────────┘
```

## Principios de diseño
- **Fuente única de verdad clínica:** `ml/preprocessing_pipeline.py` concentra la
  corrección de Hb por altitud y los puntos de corte OMS. Backend, agentes y
  scripts de ML lo importan; no se duplica la lógica.
- **Agentes desacoplados:** no conocen la base de datos. El orquestador acepta
  un `logger` opcional y el backend persiste.
- **Tolerancia a fallos:** si PostgreSQL o SHAP/LIME no están disponibles, la API
  sigue respondiendo (persistencia y XAI degradan con respaldo).

Ver también: [agents.md](agents.md), [models.md](models.md), [api.md](api.md).
