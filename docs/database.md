# Base de datos · AnemIA (PostgreSQL)

## Tablas
| Tabla | Propósito |
|-------|-----------|
| `patients` | Datos anonimizados del niño/a (sexo, edad, residencia). |
| `evaluations` | Hb observada, altitud, Hbc, ajuste y programas sociales. |
| `predictions` | Diagnóstico, probabilidad y vector de probabilidades por clase. |
| `explanations` | Payload SHAP/LIME serializado (JSON). |
| `recommendations` | Pauta terapéutica MINSA asociada. |
| `agent_logs` | Auditoría por agente: estado, tiempo (ms) y mensaje. |

Relaciones: `patients 1—N evaluations 1—1 predictions 1—N {explanations, recommendations}`.
`agent_logs` se agrupa por `run_id`.

## Inicialización
- **Docker:** `database/schema.sql` y `database/seed.sql` se montan en
  `/docker-entrypoint-initdb.d` y se ejecutan en el primer arranque.
- **Manual:** `psql "$DATABASE_URL" -f database/init.sql`.
- **ORM:** al iniciar, el backend llama a `Base.metadata.create_all()` si la DB
  está disponible (idempotente).

## Migraciones (Alembic)
```bash
alembic revision --autogenerate -m "cambio de esquema"
alembic upgrade head
```
Configuración en `alembic.ini`; entorno en `database/migrations/env.py`.
