# Despliegue académico de AnemIA v1: Render + Neon

Esta guía prepara la aplicación monolítica original para una demostración. No
crea microservicios y no contiene credenciales. El tag local
`anemia-v1-original` identifica el commit anterior a esta preparación.

## Recursos

- `anemia-v1-api`: Render Web Service con `Dockerfile.backend.render`.
- `anemia-v1-web`: Render Static Site generado desde `frontend/`.
- PostgreSQL: proyecto externo en Neon.

`render.yaml` deja `autoDeployTrigger: off`. Importar el Blueprint no debe
hacerse hasta recibir autorización expresa.

## Variables que se cargan manualmente

### Backend

| Variable | Valor |
|---|---|
| `DATABASE_URL` | URL de conexión de Neon, incluida su configuración SSL |
| `CORS_ORIGINS` | URL HTTPS exacta del Static Site, sin `/` final |
| `GEMINI_API_KEY` | Secreto opcional; vacío activa el fallback MINSA |

### Frontend

| Variable | Valor |
|---|---|
| `REACT_APP_API_URL` | URL HTTPS exacta del Web Service, sin `/` final |

La URL del API es de **build-time**: Webpack la sustituye mediante
`DefinePlugin` y la deja embebida en `bundle.js`. Cambiarla exige reconstruir
el Static Site.

## Inicialización de Neon

Opción recomendada antes del primer deploy:

```powershell
psql "$env:DATABASE_URL" -f database/schema.sql
```

No ejecutar `database/init.sql` desde el SQL Editor de Neon: contiene comandos
`psql` (`\ir`) y no es SQL puro. El seed es opcional y solo contiene datos de
demostración:

```powershell
psql "$env:DATABASE_URL" -f database/seed.sql
```

Si no se ejecuta el esquema manualmente, el backend llama a
`Base.metadata.create_all()` al arrancar. Esto crea las tablas declaradas por
SQLAlchemy, pero no sustituye una estrategia de migraciones futura.

## Orden de creación

1. Crear el proyecto Neon y ejecutar `database/schema.sql`.
2. Crear el Web Service y cargar `DATABASE_URL`.
3. Obtener la URL pública del API.
4. Crear el Static Site con esa URL como `REACT_APP_API_URL`.
5. Obtener la URL del frontend.
6. Establecer esa URL como `CORS_ORIGINS` y desplegar nuevamente el backend.
7. Verificar `/health`, `/models/status` y la interfaz.

## Seguridad de la demostración

- Usar exclusivamente casos sintéticos.
- No subir `.env`, URLs de Neon, API keys ni credenciales.
- El chat recibe el reporte de la conversación desde el navegador; no usa un
  estado global compartido entre visitantes.
- La API no implementa autenticación ni rate limiting. No debe presentarse
  como servicio clínico de producción.
- Los endpoints `/dashboard` y `/agents/logs` muestran métricas operativas. Si
  la demostración fuese abierta fuera del curso, se recomienda deshabilitarlos
  o protegerlos con autenticación.

## Rollback

### Código local

No usar `reset --hard` sobre un árbol con cambios. Crear una rama nueva desde
el tag preservado:

```powershell
git switch -c restore/anemia-v1-original anemia-v1-original
```

### Render

1. Mantener `autoDeployTrigger: off` durante la demostración.
2. Conservar el último deploy saludable en el historial de Render.
3. Si un deploy falla sus health checks, no promoverlo.
4. Ante una regresión, usar **Rollback** al deploy saludable anterior.
5. Restaurar primero el backend y después reconstruir el frontend si cambió la
   URL del API.

### Base de datos

- `schema.sql` usa `CREATE TABLE IF NOT EXISTS` y no elimina datos.
- No aplicar cambios destructivos durante la demo.
- Exportar un respaldo lógico antes de cualquier cambio de esquema:

```powershell
pg_dump "$env:DATABASE_URL" --format=custom --file=anemia-v1.backup
```

El archivo de respaldo no debe añadirse al repositorio.

## Checklist

### Antes del deploy

- [ ] `git status` revisado; `.env` y `.joblib` siguen ignorados.
- [ ] Tag `anemia-v1-original` verificable localmente.
- [ ] No hay credenciales en archivos rastreados.
- [ ] Backend y frontend compilan localmente.
- [ ] Tests clínicos y API pasan.
- [ ] LIME devuelve `method: lime` con la muestra versionada.
- [ ] La memoria máxima del backend fue medida y comparada con el plan elegido.

### Neon

- [ ] Región elegida cerca de Render.
- [ ] `database/schema.sql` ejecutado sin errores.
- [ ] Conexión SSL verificada.
- [ ] Seed agregado solo si se desea contenido inicial.

### Render backend

- [ ] Build produce ambos `.joblib` dentro de la imagen.
- [ ] `/health` responde 2xx.
- [ ] `/models/status` informa ambos modelos entrenados.
- [ ] `database` aparece como `connected`.
- [ ] `CORS_ORIGINS` coincide exactamente con el frontend.
- [ ] `GEMINI_API_KEY` no aparece en logs ni código.

### Render frontend

- [ ] `REACT_APP_API_URL` contiene `https://` y la URL correcta.
- [ ] `bundle.js` no contiene `http://localhost:8000`.
- [ ] Refrescar `/dashboard`, `/history` y `/about` no devuelve 404.

### Pruebas funcionales

- [ ] Caso sintético con Random Forest.
- [ ] Caso sintético con XGBoost.
- [ ] SHAP local devuelve factores.
- [ ] LIME devuelve factores y método real.
- [ ] Recomendación fallback funciona sin Gemini.
- [ ] Chat de dos navegadores no mezcla reportes.
- [ ] Evaluación persistida aparece en dashboard/logs.
- [ ] PDF se descarga en el navegador.
- [ ] Cold start del plan gratuito medido antes de la exposición.
