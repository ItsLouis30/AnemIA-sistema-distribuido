# Frontend — AnemIA

React 18 + TypeScript + Webpack 5, diseño mobile-first con Tailwind CSS. Interfaz conversacional para el sistema multiagente de diagnóstico de anemia pediátrica en la región Puno.

---

## Estructura de carpetas

```
frontend/
├── public/
│   ├── index.html               # Punto de entrada HTML del SPA
│   └── static/
│       ├── app.js               # JS de respaldo
│       └── styles.css           # CSS de Tailwind compilado (por CLI, no webpack)
├── src/
│   ├── index.tsx                # Punto de entrada React (monta <App />)
│   ├── App.tsx                  # Router principal con transiciones animadas
│   ├── CaseContext.tsx          # Contexto global del caso clínico activo
│   ├── global.d.ts              # Declaraciones TypeScript globales (env vars, CSS)
│   ├── pageTransition.ts        # Config de Framer Motion para transiciones de página
│   ├── pages/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   ├── data/
│   ├── mocks/
│   └── styles/
├── nginx.conf.template          # Routing SPA + caché (puerto ${PORT} vía envsubst)
├── webpack.config.js            # Configuración Webpack 5
├── tailwind.config.js           # Paleta de colores teal personalizada
├── tsconfig.json                # TypeScript (ES2020, strict, no emit)
├── postcss.config.js            # PostCSS + autoprefixer
└── package.json                 # Dependencias y scripts
```

---

## Páginas (`src/pages/`)

| Archivo | Ruta | Descripción |
|---|---|---|
| `Home.tsx` | `/` | Redirige a `/chat` |
| `Chat.tsx` | `/chat` | Interfaz conversacional principal (página de entrada) |
| `Dashboard.tsx` | `/dashboard` | Métricas del sistema, distribución de diagnósticos, estado de modelos |
| `History.tsx` | `/history` | Logs paginados de ejecuciones del pipeline de agentes |
| `Prediction.tsx` | `/prediction` | Formulario de predicción standalone (fuera del chat) |
| `Explainability.tsx` | `/explainability` | Visualizador de explicaciones SHAP y LIME |
| `Agents.tsx` | `/agents` | Visualización del flujo de los 6 agentes con métricas |
| `About.tsx` | `/about` | Info del sistema, stack tecnológico, equipo y aviso de prototipo |
| `NotFound.tsx` | `*` | Página 404 |

---

## Componentes (`src/components/`)

### Layout y navegación

| Componente | Descripción |
|---|---|
| `Header.tsx` | Header sticky con branding AnemIA e indicador de estado del sistema |
| `MobileLayout.tsx` | Wrapper mobile-first: header + banner de aviso + contenido + nav inferior |
| `BottomNav.tsx` | Barra de navegación fija inferior (Chat / Panel / History / About) |

### Genéricos reutilizables

| Componente | Descripción |
|---|---|
| `AnimatedCard.tsx` | Wrapper con animación de entrada (fade + slide) |
| `DashboardCard.tsx` | Tarjeta de métrica grande (número + etiqueta + subtítulo opcional) |
| `ErrorMessage.tsx` | Banner de error con ícono |
| `LoadingAnimation.tsx` | Spinner con etiqueta y animación fade |
| `ModelSelector.tsx` | Toggle de 2 columnas: Random Forest vs XGBoost |
| `PredictionForm.tsx` | Formulario clínico completo (6 secciones) |
| `PredictionResultCard.tsx` | Resumen de resultado: Hb observada / ajuste / Hbc / diagnóstico / probabilidades |
| `ShapChart.tsx` | Gráfico de barras horizontal (Recharts) para factores XAI |
| `LimePanel.tsx` | Panel de explicación LIME con colores y descripción personalizada |
| `AgentFlow.tsx` | Visualización del flujo de los 6 agentes |
| `AgentStatusCard.tsx` | Tarjeta de estado de un agente individual |
| `ui/Button.tsx` | Botón reutilizable con 4 variantes: `primary / secondary / ghost / danger` |

### Subgrupo `agents/`

| Componente | Descripción |
|---|---|
| `AgentSidebar.tsx` | Sidebar desktop con lista de agentes, barra de progreso y conteo de completados |
| `AgentPanel.tsx` | Panel desktop enriquecido: resumen del caso + timeline + header de estado |
| `MobileAgentDrawer.tsx` | Drawer colapsable mobile con badges de estado de cada agente |
| `AgentTimeline.tsx` | Timeline vertical animado con indicadores de progreso de los 6 agentes |
| `AgentStatusItem.tsx` | Fila de agente: punto de estado, nombre, descripción, tiempo transcurrido |

### Subgrupo `chat/`

| Componente | Descripción |
|---|---|
| `ChatLayout.tsx` | Layout flex del chat: mensajes scrolleables + sidebar opcional |
| `ChatHeader.tsx` | Header grande con degradado, branding y pulso de estado del sistema |
| `ChatMessage.tsx` | Burbuja de mensaje con estilo por rol (assistant / user / system / agent) y efecto typewriter |
| `ChatInput.tsx` | Barra de entrada sticky: campo de texto + botón enviar + chips de acciones rápidas |
| `QuickCommands.tsx` | 5 chips de acción: cargar ejemplo, nuevo caso, analizar, ver agentes, dashboard |
| `TypingIndicator.tsx` | Indicador animado de 3 puntos mientras el bot "escribe" |
| `AcademicWarning.tsx` | Banner amarillo con aviso de prototipo académico |

### Subgrupo `clinical/`

| Componente | Descripción |
|---|---|
| `ClinicalFormCard.tsx` | Formulario clínico grande con validación y agrupación de campos |
| `PredictionResultBubble.tsx` | Burbuja de chat con Hb / ajuste / Hbc, caja de diagnóstico y barras de probabilidad |
| `ExplainabilityBubble.tsx` | Burbuja con top 6 factores SHAP/LIME como barras duales animadas |
| `RecommendationBubble.tsx` | Burbuja con título y bullets de recomendación MINSA-CRED |
| `ReportCard.tsx` | Reporte unificado completo (EESS, paciente, programas, evaluación, resultado ML, recomendación) con exportación a PDF e impresión vía `html2canvas` + `jsPDF` |

---

## Hooks (`src/hooks/`)

| Hook | Descripción |
|---|---|
| `useChat.ts` | Lógica central del chat: mensajes, fase del chat, datos del formulario, estado de agentes, scroll automático, carga de caso de ejemplo |
| `usePrediction.ts` | Ejecuta el endpoint `/agents/run`; gestiona reporte, loading y errores |
| `useExplainability.ts` | Fetch paralelo de `/explain/shap` y `/explain/lime`; función `seed` para reusar explicaciones de un reporte existente |
| `useDashboard.ts` | Obtiene datos de dashboard y estado de modelos al montar; función de refresh |
| `useAgents.ts` | Obtiene logs de agentes con auto-carga opcional; refresh manual |
| `useTypewriter.ts` | Animación de revelado carácter a carácter (intervalo de 25 ms por defecto) |
| `useExampleCase.ts` | Retorna los datos del caso de ejemplo de Juliaca |

---

## Servicios (`src/services/`)

**`api.ts`** — cliente Axios con base URL desde `REACT_APP_API_URL`. Endpoints definidos:

| Endpoint | Método | Propósito |
|---|---|---|
| `/predict` | POST | Predicción directa ML |
| `/agents/run` | POST | Pipeline completo de 6 agentes |
| `/agents/logs` | GET | Logs de ejecuciones previas |
| `/explain/shap` | POST | Explicación SHAP |
| `/explain/lime` | POST | Explicación LIME |
| `/models/status` | GET | Estado de los modelos cargados |
| `/dashboard` | GET | Métricas del dashboard |
| `/health` | GET | Health check del backend |

---

## Tipos (`src/types/`)

| Archivo | Contenido |
|---|---|
| `index.ts` | Re-exporta todos los módulos de tipos |
| `api.ts` | `ApiError`, `ModelStatusResponse`, `AgentLogsResponse` |
| `agent.ts` | `AgentLogEntry`, `Recommendation`, `AgentRunReport` (con sub-objetos por agente) |
| `chat.ts` | `MessageRole`, `AgentStatus`, `ChatPhase`, `ChatMessage`, `AgentDescriptor`, `QuickAction` |
| `clinical.ts` | `ClinicalFormData`, `defaultClinicalForm`, `ejemploJuliaca` |
| `prediction.ts` | `ModelName`, `DiagnosisCode`, `ClinicalCase`, `PredictionResult` |
| `explanation.ts` | `XaiFactor`, `ExplanationResult`, `ShapResult` |
| `dashboard.ts` | `ModelStatus`, `DashboardData` |

---

## Datos y mocks (`src/data/` y `src/mocks/`)

- **`data/puno.ts`** — 13 provincias y 100+ distritos de Puno con su altitud. Helpers: `getDistritos(provincia)`, `getAltitud(distrito)`.
- **`mocks/exampleCase.ts`** — Caso de ejemplo (niña, 53.62 meses, Hb 13.7, altitud 3877 m, Juliaca). Mapa de colores por diagnóstico: Normal `#16a34a` · Leve `#d97706` · Moderada `#ea580c` · Severa `#dc2626`.
- **`mocks/mockAgentRun.ts`** — `buildDemoReport()`: implementa la tabla de ajuste de altitud (RM-258-2020-MINSA), clasificación por Hbc, probabilidades, datos mock de SHAP/LIME y constructor de recomendaciones. `mockAgentRunResponse()`: reporte fijo del caso Juliaca.

---

## Contexto global (`CaseContext.tsx`)

Provee a todas las páginas mediante React Context:
- El caso clínico activo (`ClinicalFormData`)
- El modelo ML seleccionado (`ModelName`)
- El reporte del último run de agentes (`AgentRunReport`)
- Setters para cada uno de los anteriores

---

## Configuración de build

### Webpack (`webpack.config.js`)

- **Entrada:** `src/index.tsx`
- **Salida:** `public/bundle.js` (nombre fijo, sin hash, por incompatibilidad del carácter `!` en la ruta del proyecto en Windows)
- **Loader:** `ts-loader` con `transpileOnly: true` para velocidad
- **DefinePlugin:** inyecta `REACT_APP_API_URL` desde el `.env` raíz (default: `http://localhost:8000`)
- **Dev server:** puerto 3000, `historyApiFallback: true` para React Router; `client` y `liveReload` deshabilitados (reload manual con Ctrl+R)
- **CSS:** compilado externamente con `npm run css` (Tailwind CLI → `public/styles.css`), no pasa por webpack

### Tailwind (`tailwind.config.js`)

- Paleta de marca **teal** personalizada: 50 (`#f0fdfa`) → 900 (`#134e4a`)
- Fuente base: Inter
- Content paths: `./index.html` + `./src/**/*.{ts,tsx}`

### TypeScript (`tsconfig.json`)

- Target ES2020, módulos ESNext
- JSX: `react-jsx`
- Modo strict activado
- `noEmit: true` (solo type-check, webpack transpila)

### Nginx (`nginx.conf.template`)

- Puerto `${PORT}` (3000 en local; lo inyecta el PaaS en despliegue). La
  plantilla se procesa con `envsubst` en el arranque del contenedor nginx.
- Routing SPA: `try_files $uri $uri/ /index.html`
- JS/CSS: sin caché con revalidación por ETag
- Assets estáticos: 7 días de caché
- HTML: siempre revalidado

---

## Scripts disponibles

```bash
npm start            # Dev server en http://localhost:3000
npm run build        # Bundle de producción
npm run type-check   # Validación TypeScript sin emit
npm run css          # Recompila Tailwind CSS manualmente
```

---

## Dependencias principales

| Paquete | Versión | Uso |
|---|---|---|
| `react` | 18.3.1 | Framework UI |
| `react-router-dom` | 6.28.1 | Routing SPA |
| `axios` | 1.7.9 | Cliente HTTP para el backend FastAPI |
| `framer-motion` | 11.15.0 | Animaciones de páginas, tarjetas y botones |
| `recharts` | 2.15.0 | Gráficos de barras y torta (XAI + dashboard) |
| `lucide-react` | 0.469.0 | Íconos |
| `html2canvas` + `jspdf` | 1.4.1 / 4.2.1 | Exportación de reporte a PDF |
| `tailwindcss` | 3.4.17 | Estilos utilitarios |
| `typescript` | 5.7.2 | Tipado estático |
| `webpack` | 5.97.1 | Bundler |
