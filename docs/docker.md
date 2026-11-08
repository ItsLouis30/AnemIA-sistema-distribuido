# Docker · AnemIA

## Servicios (`docker-compose.yml`)
| Servicio | Imagen | Puerto | Descripción |
|----------|--------|--------|-------------|
| `db` | postgres:16-alpine | 5433→5432 | Base de datos (host 5433, interno 5432). |
| `backend` | Dockerfile.backend (python:3.11-slim) | 8000 | FastAPI + ML + XAI (Uvicorn). Entrena RF si falta. |
| `frontend` | Dockerfile.frontend (node:20 → nginx) | 3000 | Build de **Webpack** servido por Nginx. |
| `pgadmin` | dpage/pgadmin4 | 5050 | Opcional (`profile: tools`). |

## Comandos
```bash
docker compose up --build          # levantar todo
docker compose --profile tools up  # incluir pgAdmin
docker compose down                # detener
docker compose down -v             # detener y borrar el volumen de datos
```

## Notas
- El frontend se construye con `npm run build` (**Webpack 5**, no Vite) y el resultado
  estático (`dist/`) se sirve con Nginx en el puerto **3000**.
- `REACT_APP_API_URL` se inyecta como build-arg del frontend (por defecto
  `http://localhost:8000`).
- El backend monta `./ml/saved_models` para conservar los modelos entrenados.
- Memoria recomendada: 2–4 GB (XGBoost + SHAP + LIME en memoria).
