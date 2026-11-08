import { motion } from 'framer-motion'
import { Activity, Database, HardDrive } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import AnimatedCard from '../components/AnimatedCard'
import ClassBalanceChart from '../components/dashboard/ClassBalanceChart'
import ModelComparisonRadar from '../components/dashboard/ModelComparisonRadar'
import ModelMetricsCard from '../components/dashboard/ModelMetricsCard'
import DashboardCard from '../components/DashboardCard'
import LoadingAnimation from '../components/LoadingAnimation'
import { useCaseStats } from '../hooks/useCaseStats'
import { useDashboard } from '../hooks/useDashboard'
import { diagnosisColors } from '../mocks/exampleCase'
import { pageTransition } from '../pageTransition'

const labelToCode: Record<string, string> = {
  Normal: 'Normal',
  'Anemia Leve': 'AnemiaLeve',
  'Anemia Moderada': 'AnemiaModerada',
  'Anemia Severa': 'AnemiaSevera',
}

type PersistenceTone = 'server' | 'local' | 'warn' | 'idle'

interface PersistenceStatus {
  tone: PersistenceTone
  label: string
  detail: string
}

const toneChip: Record<PersistenceTone, string> = {
  server: 'bg-emerald-100 text-emerald-700',
  local: 'bg-teal-100 text-teal-700',
  warn: 'bg-amber-100 text-amber-700',
  idle: 'bg-slate-100 text-slate-500',
}

/**
 * Calcula el estado real de persistencia combinando dos señales: la BD del
 * backend (`database`, de GET /dashboard) y el historial local del navegador
 * (`totalCases`, mismo origen que la barra lateral). Nunca devuelve un texto
 * fijo: refleja dónde viven de verdad los datos del usuario. La etiqueta del
 * chip es corta (cabe en la tarjeta a media columna en móvil) y el detalle
 * lleva la explicación completa.
 */
function describePersistence(
  database: string | undefined,
  totalCases: number,
  backendLoading: boolean,
): PersistenceStatus {
  // 1) BD del servidor conectada → fuente de verdad en PostgreSQL.
  if (database === 'connected') {
    return {
      tone: 'server',
      label: 'Conectada',
      detail: 'Base de datos PostgreSQL en el servidor',
    }
  }
  // 2) Hay historial guardado en el navegador → persistencia local activa.
  if (totalCases > 0) {
    return {
      tone: 'local',
      label: 'Local',
      detail:
        database === 'unavailable'
          ? 'Servidor sin BD · historial en este navegador'
          : 'Historial guardado en este navegador',
    }
  }
  // 3) Sin datos locales todavía: distinguimos «verificando», «BD caída» y «vacío».
  if (backendLoading) {
    return { tone: 'idle', label: 'Verificando…', detail: 'Consultando estado del servidor' }
  }
  if (database === 'unavailable') {
    return {
      tone: 'warn',
      label: 'No disponible',
      detail: 'Base de datos no disponible · se usará historial local',
    }
  }
  return { tone: 'idle', label: 'Sin datos', detail: 'Aún no hay consultas registradas' }
}

export default function Dashboard() {
  const { data, models, loading: backendLoading } = useDashboard()
  // Conteo y distribución salen del MISMO historial que la barra lateral
  // (IndexedDB), no del backend: así el Panel nunca muestra 0 mientras existan
  // consultas recientes.
  const stats = useCaseStats()

  if (stats.loading) return <LoadingAnimation label="Cargando panel…" />

  const pieData = Object.entries(stats.byDiagnosis).map(([name, value]) => ({ name, value }))
  // Datos de modelos para los gráficos comparativos (backend /models/status).
  const trainedModels = models.filter((m) => m.trained && m.metrics?.test)
  const modelMetrics = models.find((m) => m.metrics?.split)?.metrics
  const splitStrategy = modelMetrics?.split.strategy ?? 'split temporal (train 2024 / test 2025)'
  const classDistribution = modelMetrics?.class_distribution
  const distClasses = modelMetrics?.test.classes ?? []
  const persistence = describePersistence(data?.database, stats.total, backendLoading)
  const PersistIcon = persistence.tone === 'local' ? HardDrive : Database
  const casesSubtitle =
    stats.total > 0
      ? `${stats.predictions} con diagnóstico`
      : 'Registra un caso para empezar'

  return (
    <motion.div {...pageTransition} className="space-y-4">
      <h2 className="text-lg font-bold text-slate-800">Panel de control</h2>

      <div className="grid grid-cols-2 gap-3">
        <DashboardCard
          title="Casos registrados"
          value={stats.total}
          subtitle={casesSubtitle}
          icon={<Activity size={18} />}
        />
        <AnimatedCard delay={0.05}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className={`chip ${toneChip[persistence.tone]}`}>{persistence.label}</span>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{persistence.detail}</p>
            </div>
            <span
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"
              aria-hidden="true"
            >
              <PersistIcon size={18} />
            </span>
          </div>
        </AnimatedCard>
      </div>

      {pieData.length > 0 && (
        <AnimatedCard delay={0.1}>
          <p className="mb-2 text-sm font-semibold text-slate-700">Distribución por diagnóstico</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label>
                {pieData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={diagnosisColors[labelToCode[entry.name] || entry.name] || '#64748b'}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </AnimatedCard>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800">Rendimiento de modelos</h3>
        <p className="-mt-1 text-xs text-slate-400">
          Métricas de entrenamiento y prueba · {splitStrategy} · balanceo SMOTE solo en train.
          Conmuta entre conjuntos en cada tarjeta.
        </p>

        {trainedModels.length >= 2 && (
          <AnimatedCard delay={0.13}>
            <p className="text-sm font-semibold text-slate-700">Comparativa de modelos (prueba)</p>
            <p className="mb-2 text-[11px] text-slate-400">
              Cuanto más externo el polígono, mejor. El de mayor área es el modelo preferible.
            </p>
            <ModelComparisonRadar models={models} />
          </AnimatedCard>
        )}

        {models.map((m, i) => (
          <ModelMetricsCard key={m.name} model={m} delay={0.15 + i * 0.05} />
        ))}

        {classDistribution && distClasses.length > 0 && (
          <AnimatedCard delay={0.2}>
            <p className="text-sm font-semibold text-slate-700">Balanceo de clases (SMOTE)</p>
            <p className="mb-2 text-[11px] text-slate-400">
              Muestras por clase en entrenamiento, antes y después de SMOTE. El resampleo solo se
              aplica al entrenamiento; la prueba conserva su distribución real.
            </p>
            <ClassBalanceChart distribution={classDistribution} classes={distClasses} />
          </AnimatedCard>
        )}

        {!backendLoading && models.length === 0 && (
          <p className="text-xs text-slate-400">
            Métricas no disponibles (backend sin conexión o modelos sin entrenar).
          </p>
        )}
      </div>

      <AnimatedCard delay={0.2}>
        <p className="mb-2 text-sm font-semibold text-slate-700">Logs recientes</p>
        {data?.recent_logs?.length ? (
          <div className="space-y-1">
            {data.recent_logs.map((log, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-slate-600">{log.agent}</span>
                <span className={log.status === 'ok' ? 'text-emerald-600' : 'text-red-500'}>
                  {log.status} · {log.elapsed_ms} ms
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">Aún no hay registros de ejecución.</p>
        )}
      </AnimatedCard>
    </motion.div>
  )
}
