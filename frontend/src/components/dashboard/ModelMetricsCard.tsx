import { useState } from 'react'

import type { ModelStatus } from '../../types'
import AnimatedCard from '../AnimatedCard'
import ConfusionMatrix from './ConfusionMatrix'
import { fmt, shortLabel } from './labels'
import PerClassBarChart from './PerClassBarChart'

interface Props {
  model: ModelStatus
  delay?: number
}

const MODEL_LABEL: Record<string, string> = {
  random_forest: 'Random Forest',
  xgboost: 'XGBoost',
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm font-bold tabular-nums text-slate-700">{value}</p>
    </div>
  )
}

/** Tarjeta de rendimiento de un modelo: métricas train/test, matriz de
 *  confusión y barras por clase, con conmutador entre conjuntos. */
export default function ModelMetricsCard({ model, delay = 0 }: Props) {
  const [view, setView] = useState<'test' | 'train'>('test')
  const m = model.metrics

  if (!model.trained || !m?.test) {
    return (
      <AnimatedCard delay={delay}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">
            {MODEL_LABEL[model.name] ?? model.name}
          </p>
          <span className="chip bg-amber-100 text-amber-700">sin entrenar</span>
        </div>
      </AnimatedCard>
    )
  }

  const block = view === 'test' ? m.test : m.train
  const dist = m.class_distribution

  return (
    <AnimatedCard delay={delay}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-700">
            {MODEL_LABEL[model.name] ?? model.name}
          </p>
          <p className="text-[11px] text-slate-400">
            {m.split.balancing} · train {m.split.n_train} / test {m.split.n_test}
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 text-xs">
          {(['test', 'train'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1 font-medium transition-colors ${
                view === v ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {v === 'test' ? 'Prueba' : 'Entrenamiento'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        <MetricChip label="Accuracy" value={fmt(block.accuracy)} />
        <MetricChip label="Bal. acc" value={fmt(block.balanced_accuracy)} />
        <MetricChip label="F1 macro" value={fmt(block.f1_macro)} />
        <MetricChip label="ROC-AUC" value={fmt(block.roc_auc_macro_ovr)} />
        <MetricChip label="MCC" value={fmt(block.mcc)} />
        <MetricChip label="Kappa" value={fmt(block.cohen_kappa)} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <MetricChip label="F1 weighted" value={fmt(block.f1_weighted)} />
        <MetricChip label="PR-AUC" value={fmt(block.pr_auc_macro)} />
        <MetricChip label="Log-loss" value={fmt(block.log_loss)} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold text-slate-600">
            Matriz de confusión ({view === 'test' ? 'prueba' : 'entrenamiento'})
          </p>
          <ConfusionMatrix matrix={block.confusion_matrix} classes={block.classes} />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold text-slate-600">Métricas por clase</p>
          <PerClassBarChart perClass={block.per_class} classes={block.classes} />
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-1 text-xs font-semibold text-slate-600">
          Distribución de clases en entrenamiento (antes → después de SMOTE)
        </p>
        <div className="space-y-1">
          {block.classes.map((c) => (
            <div key={c} className="flex items-center justify-between text-xs">
              <span className="text-slate-600">{shortLabel(c)}</span>
              <span className="tabular-nums text-slate-500">
                {dist.raw_train[c] ?? 0} → {dist.after_smote[c] ?? 0}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AnimatedCard>
  )
}
