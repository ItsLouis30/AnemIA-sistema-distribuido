import { motion } from 'framer-motion'
import { Download, FileText, Printer } from 'lucide-react'

import { useClinicalPdf } from '../../hooks/useClinicalPdf'
import type { AgentRunReport } from '../../types'

interface Props {
  report: AgentRunReport
}

export default function ReportCard({ report }: Props) {
  const { generating, error: pdfError, downloadPdf, printPdf } = useClinicalPdf()

  const pre = report.preprocessing
  const pred = report.prediction
  const rec = report.recommendation
  const mon = report.monitoring
  if (!pre || !pred || !rec) return null

  const fecha = new Date(report.generated_at).toLocaleDateString('es-PE', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const progr = [
    report.case.Juntos ? 'Juntos' : '',
    report.case.SIS ? 'SIS' : '',
    report.case.Qaliwarma ? 'Qali Warma' : '',
    report.case.Cred ? 'CRED' : '',
    report.case.Suplementacion ? 'Suplementación Fe' : '',
    report.case.Consejeria ? 'Consejería' : '',
    report.case.Sesion ? 'Sesión demostrativa' : '',
  ].filter(Boolean).join(', ') || 'Ninguno registrado'

  const badgeClass: Record<string, string> = {
    Normal: 'bg-green-100 text-green-700 border-green-300',
    AnemiaLeve: 'bg-amber-100 text-amber-700 border-amber-300',
    AnemiaModerada: 'bg-orange-100 text-orange-700 border-orange-300',
    AnemiaSevera: 'bg-red-100 text-red-700 border-red-300',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay: 0.2 }}
      className="rounded-2xl border border-slate-300 bg-white shadow-sm overflow-hidden"
      role="region"
      aria-label="Reporte clínico unificado"
    >
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white">
        <FileText size={15} />
        <span className="text-sm font-semibold">Reporte Clínico Unificado · AnemIA</span>
      </div>

      <div className="p-3" id="report-content">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] text-slate-500">Fecha de generación</p>
            <p className="text-xs font-semibold text-slate-800">{fecha}</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${badgeClass[pred.diagnosis_code] || 'bg-slate-100 text-slate-700'}`}>
            {pred.diagnosis_label}
          </span>
        </div>

        <ReportSection title="Establecimiento de Salud" icon="🏥">
          <div className="grid grid-cols-2 gap-1">
            <ResultRow label="Provincia EESS" value={report.case.Prov_EESS || '—'} />
            <ResultRow label="Distrito EESS" value={report.case.Dist_EESS || '—'} />
          </div>
        </ReportSection>

        <ReportSection title="Datos del Paciente" icon="👶">
          <div className="grid grid-cols-2 gap-1">
            <ResultRow label="Sexo" value={report.case.Sexo === 'F' ? 'Femenino' : 'Masculino'} />
            <ResultRow label="Edad" value={`${report.case.EdadMeses} meses`} />
            <ResultRow label="Provincia REN" value={report.case.ProvinciaREN || '—'} />
            <ResultRow label="Distrito REN" value={report.case.DistritoREN || '—'} />
            <ResultRow label="Altitud residencia" value={`${report.case.AlturaREN} m.s.n.m.`} />
          </div>
        </ReportSection>

        <ReportSection title="Programas y Controles" icon="🛡️">
          <p className="text-xs text-slate-700">{progr}</p>
        </ReportSection>

        <ReportSection title="Evaluación Clínica" icon="💧">
          <div className="grid grid-cols-2 gap-1">
            <ResultRow label="Hemoglobina observada" value={`${pre.hb_observed} g/dL`} />
            <ResultRow label="Ajuste por altitud" value={`${pre.adjustment} g/dL`} highlight />
            <ResultRow label="Hemoglobina corregida (Hbc)" value={`${pre.hbc} g/dL`} highlight />
            <ResultRow label="Normativa" value={pre.normative_framework} small />
          </div>
        </ReportSection>

        <ReportSection title="Resultado del Modelo ML" icon="🤖">
          <div className="grid grid-cols-2 gap-1">
            <ResultRow label="Diagnóstico estimado" value={pred.diagnosis_label} />
            <ResultRow label="Modelo" value={pred.model} />
            <ResultRow label="Probabilidad" value={`${pred.probability}%`} />
            {pred.class_probabilities && (
              <div className="col-span-2 mt-1">
                <p className="text-[10px] text-slate-500 mb-1">Probabilidades por clase:</p>
                {Object.entries(pred.class_probabilities).map(([cls, prob]) => (
                  <div key={cls} className="flex items-center justify-between text-[10px] py-0.5">
                    <span className="text-slate-600">{cls}</span>
                    <span className="font-semibold text-slate-700">{(prob * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ReportSection>

        <ReportSection title="Recomendación Referencial" icon="💊">
          <p className="text-xs font-semibold text-slate-800 mb-1">{rec.title}</p>
          {rec.items.slice(0, 3).map((item, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[10px] text-slate-600 py-0.5">
              <span className="mt-1 flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />
              {item}
            </div>
          ))}
          {rec.items.length > 3 && (
            <p className="text-[10px] text-slate-400 mt-0.5">+ {rec.items.length - 3} recomendaciones adicionales</p>
          )}
        </ReportSection>

        {mon && (
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-[10px] text-slate-500 border border-slate-200 mt-2">
            <span>Pipeline: {report.agent_logs?.length ?? mon.agents_run} agentes</span>
            <span>{mon.total_elapsed_ms} ms · {mon.status}</span>
          </div>
        )}

        <div className="rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-2 text-[10px] text-amber-700 mt-2">
          ⚠ <strong>Nota académica:</strong> Este reporte es generado por un prototipo de investigación. No reemplaza el diagnóstico clínico profesional. Toda decisión médica debe ser tomada por personal de salud autorizado.
        </div>

        {pdfError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-2.5 py-1.5 text-[10px] text-red-700 mt-2" role="alert">
            {pdfError}
          </div>
        )}

        <div className="flex gap-2 mt-3">
          <button onClick={() => downloadPdf(report)} disabled={generating} className="btn-primary flex-1 text-xs py-2">
            <Download size={12} />
            {generating ? 'Generando PDF…' : 'Descargar PDF'}
          </button>
          <button onClick={() => printPdf(report)} disabled={generating} className="btn-ghost text-xs py-2">
            <Printer size={12} /> Imprimir
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function ReportSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="mb-2.5 pb-2.5 border-b border-dashed border-slate-200 last:border-b-0 last:mb-0 last:pb-0">
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-teal-700 mb-1">{icon} {title}</h4>
      {children}
    </div>
  )
}

function ResultRow({ label, value, highlight, small }: { label: string; value: string; highlight?: boolean; small?: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5 border-b border-slate-50 last:border-b-0">
      <span className="text-[10px] text-slate-500">{label}</span>
      <span className={`text-[10px] font-semibold ${highlight ? 'text-teal-700' : 'text-slate-700'}`}>{value}</span>
    </div>
  )
}
