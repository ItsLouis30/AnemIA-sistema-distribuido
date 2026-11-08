# Puesta en marcha · AnemIA

## Opción A — Docker (recomendada)
```bash
docker compose up --build      # el .env único de la raíz ya está incluido
```
- Frontend: http://localhost:3000
- Backend (Swagger): http://localhost:8000/docs
- pgAdmin (opcional): `docker compose --profile tools up` → http://localhost:5050

## Opción B — Local (uv + .venv)

### 1. Backend + ML (Python 3.11+)
```bash
uv venv
.venv\Scripts\activate            # Windows (Linux/macOS: source .venv/bin/activate)
uv pip install -r requirements.txt

# Entrenar modelos (genera ml/saved_models/*.joblib)
uv run python ml/train_random_forest.py
uv run python ml/train_xgboost.py

# Levantar la API con Uvicorn
uv run uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```
> `uv` gestiona el entorno y las dependencias; `uvicorn` sirve FastAPI. No confundir.
> Sin PostgreSQL la API funciona igual; solo se desactiva la persistencia.

### 2. Frontend (React + Webpack, Node 20)
```bash
cd frontend
npm install
npm start          # http://localhost:3000
npm run build      # build de producción → frontend/dist/
```

Variable de entorno del frontend: `REACT_APP_API_URL=http://localhost:8000`.

## Pruebas
```bash
uv run pytest -q                  # lógica clínica + humo de API
```

Ver también la guía de comandos y prueba manual: [`../COMANDOS_EJECUCION.md`](../COMANDOS_EJECUCION.md).
