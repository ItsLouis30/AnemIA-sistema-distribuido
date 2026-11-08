# API REST · AnemIA (FastAPI)

Base URL local: `http://localhost:8000` · Documentación interactiva: `/docs`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Estado general + DB + modelos. |
| GET | `/models/status` | Estado y métricas de cada modelo. |
| POST | `/predict` | Inferencia para un caso. |
| POST | `/explain/shap` | Importancia global + local (SHAP). |
| POST | `/explain/lime` | Explicación local (LIME). |
| POST | `/agents/run` | Pipeline completo de 6 agentes (con persistencia). |
| GET | `/agents/logs` | Historial de ejecución (PostgreSQL). |
| GET | `/dashboard` | Métricas y resúmenes. |

## Cuerpo de petición (predict / explain / agents)
```json
{
  "case": {
    "Prov_EESS": "SANROMAN", "Dist_EESS": "JULIACA", "Sexo": "F",
    "EdadMeses": 53.62, "Juntos": 0, "SIS": 1, "Qaliwarma": 0, "Cred": 1,
    "Suplementacion": 1, "Consejeria": 0, "Sesion": 0, "Hemoglobina": 13.7,
    "ProvinciaREN": "SANROMAN", "DistritoREN": "JULIACA", "AlturaREN": 3877
  },
  "model": "random_forest"
}
```

## Ejemplo `POST /predict` (respuesta)
```json
{
  "model": "random_forest",
  "diagnosis_code": "Normal",
  "diagnosis_label": "Normal",
  "probability": 92.0,
  "class_probabilities": {"Normal": 0.92, "AnemiaLeve": 0.06, "AnemiaModerada": 0.015, "AnemiaSevera": 0.005},
  "hbc": 11.4
}
```

## cURL
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"case":{"Sexo":"F","EdadMeses":53.62,"Hemoglobina":13.7,"AlturaREN":3877,"ProvinciaREN":"SANROMAN"},"model":"random_forest"}'
```

Acceso libre, sin autenticación (prototipo académico).
