# Sistema Multiagente · AnemIA

6 agentes especializados + 1 orquestador (`agents/`). Comparten un `context`
mutable y cada uno reporta un `AgentLog` (estado + tiempo en ms).

| # | Agente | Archivo | Función |
|---|--------|---------|---------|
| 1 | Registro Clínico | `data_agent.py` | Valida tipos, rangos y campos obligatorios. |
| 2 | Clínico-Contextual | `preprocessing_agent.py` | Calcula Hbc por altitud (OMS/MINSA). |
| 3 | Predictivo ML | `prediction_agent.py` | Estima severidad con RF/XGBoost. |
| 4 | Explicabilidad | `explainability_agent.py` | SHAP (global+local) y LIME. |
| 5 | Terapéutico | `recommendation_agent.py` | Recomendaciones con IA (Gemini) + fallback MINSA-CRED. |
| 6 | Monitoreo/Coordinador | `monitoring_agent.py` | Audita tiempos y consolida logs. |
| — | Orquestador | `orchestrator_agent.py` | Coordina el flujo y arma el reporte. |

## Flujo
```
case → Data → Preprocessing → Prediction → Explainability → Recommendation → Monitoring → reporte
```
Si un agente crítico falla (p. ej. validación), la cadena se detiene y el
Monitoring cierra la auditoría con el error.

## Uso programático
```python
from agents.orchestrator_agent import Orchestrator
report = Orchestrator().run(case, model="random_forest")
```

El backend lo expone vía `POST /agents/run` y persiste el resultado.

## Agente Terapéutico con IA (Gemini)
El agente 5 analiza el diagnóstico estimado, la Hbc, los datos del paciente y
el factor XAI más influyente, y pide a **Google Gemini** recomendaciones cortas
(≤ 400 tokens). Usa una **cadena de modelos con degradación** definida en
`GEMINI_MODELS` (`agents/llm/gemini_client.py`, cliente REST con `httpx`): si un
modelo falla, prueba el siguiente. Si no hay `GEMINI_API_KEY` o todos fallan,
cae a las pautas MINSA-CRED por reglas, de modo que el pipeline nunca se rompe.
La salida incluye un campo `engine` (`gemini:<modelo>` | `fallback`) para
trazabilidad. Configuración en `.env` (ver `.env.example`).
