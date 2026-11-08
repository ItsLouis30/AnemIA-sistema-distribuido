// ============================================================
//  Generación de PDF clínico VECTORIAL con jsPDF (texto real, no
//  imagen). A4, márgenes consistentes, encabezado institucional,
//  pie con numeración, saltos de página automáticos sin cortar
//  contenido. Reemplaza el enfoque html2canvas (screenshot).
//
//  Es presentación pura: lee el AgentRunReport ya devuelto por el
//  backend; no altera contratos ni datos.
// ============================================================
import type { AgentRunReport, XaiFactor } from '../types'

type JsPDF = import('jspdf').jsPDF
type RGB = [number, number, number]

// Geometría A4 (mm)
const PW = 210
const PH = 297
const M = 16
const CW = PW - 2 * M
const HEADER_H = 26
const CONTENT_TOP = HEADER_H + 8
const CONTENT_BOTTOM = PH - 16

// Paleta (alineada con la marca teal de AnemIA)
const TEAL: RGB = [13, 148, 136]
const TEAL_DARK: RGB = [17, 94, 89]
const INK: RGB = [30, 41, 59]
const SLATE: RGB = [51, 65, 85]
const MUTED: RGB = [100, 116, 139]
const LINE: RGB = [203, 213, 225]
const ZEBRA: RGB = [241, 245, 249]
const WHITE: RGB = [255, 255, 255]

const BADGE: Record<string, { fill: RGB; text: RGB }> = {
  Normal: { fill: [220, 252, 231], text: [21, 128, 61] },
  AnemiaLeve: { fill: [254, 249, 195], text: [133, 77, 14] },
  AnemiaModerada: { fill: [255, 237, 213], text: [154, 52, 18] },
  AnemiaSevera: { fill: [254, 226, 226], text: [153, 27, 27] },
}

interface Ctx {
  doc: JsPDF
  y: number
  page: number
}

function setFill(doc: JsPDF, c: RGB) {
  doc.setFillColor(c[0], c[1], c[2])
}
function setText(doc: JsPDF, c: RGB) {
  doc.setTextColor(c[0], c[1], c[2])
}
function setDraw(doc: JsPDF, c: RGB) {
  doc.setDrawColor(c[0], c[1], c[2])
}

function drawHeader(doc: JsPDF) {
  setFill(doc, TEAL_DARK)
  doc.rect(0, 0, PW, HEADER_H, 'F')
  setFill(doc, TEAL)
  doc.rect(0, HEADER_H, PW, 1.2, 'F')

  // Marca
  setText(doc, WHITE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('AnemIA', M, 12)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  setText(doc, [204, 251, 241])
  doc.text('Sistema Multiagente · Diagnóstico de Anemia Infantil', M, 17.5)
  doc.text('Región Puno, Perú · OMS 2024 / RM-258-2020-MINSA', M, 21.5)

  // Etiqueta de documento (derecha)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setText(doc, WHITE)
  doc.text('REPORTE CLÍNICO', PW - M, 14, { align: 'right' })
}

function drawFooter(doc: JsPDF, page: number, total: number) {
  setDraw(doc, LINE)
  doc.setLineWidth(0.2)
  doc.line(M, PH - 12, PW - M, PH - 12)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  setText(doc, MUTED)
  doc.text(
    'Prototipo académico de investigación. No reemplaza el diagnóstico clínico profesional.',
    M,
    PH - 7.5,
  )
  doc.text(`Página ${page} de ${total}`, PW - M, PH - 7.5, { align: 'right' })
}

function newPage(ctx: Ctx) {
  ctx.doc.addPage()
  ctx.page += 1
  drawHeader(ctx.doc)
  ctx.y = CONTENT_TOP
}

function ensureSpace(ctx: Ctx, needed: number) {
  if (ctx.y + needed > CONTENT_BOTTOM) newPage(ctx)
}

function sectionTitle(ctx: Ctx, text: string) {
  ensureSpace(ctx, 12)
  const { doc } = ctx
  setFill(doc, TEAL)
  doc.rect(M, ctx.y, 2.5, 5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  setText(doc, TEAL_DARK)
  doc.text(text.toUpperCase(), M + 5, ctx.y + 4)
  ctx.y += 9
}

/** Filas clave-valor en dos columnas; nunca parte una fila entre páginas. */
function kvGrid(ctx: Ctx, pairs: Array<[string, string]>) {
  const { doc } = ctx
  const colW = CW / 2
  const rowH = 7
  for (let i = 0; i < pairs.length; i += 2) {
    ensureSpace(ctx, rowH)
    const rowPairs = pairs.slice(i, i + 2)
    if ((i / 2) % 2 === 1) {
      setFill(doc, ZEBRA)
      doc.rect(M, ctx.y - 1, CW, rowH, 'F')
    }
    rowPairs.forEach((pair, col) => {
      const x = M + col * colW
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      setText(doc, MUTED)
      doc.text(pair[0], x + 1, ctx.y + 4)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      setText(doc, SLATE)
      const value = doc.splitTextToSize(pair[1], colW - 4) as string[]
      doc.text(value[0] ?? '—', x + colW - 2, ctx.y + 4, { align: 'right' })
    })
    ctx.y += rowH
  }
  ctx.y += 2
}

/** Fila de ancho completo (texto largo: normativa, observaciones). */
function fullRow(ctx: Ctx, label: string, value: string) {
  const { doc } = ctx
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const lines = doc.splitTextToSize(value, CW - 2) as string[]
  // Altura total = etiqueta (caption) + separación + líneas de valor.
  ensureSpace(ctx, 9 + lines.length * 4.5)
  // Etiqueta (caption gris) en su propia línea.
  setText(doc, MUTED)
  doc.text(label, M + 1, ctx.y + 3.5)
  // Avanzamos lo suficiente para que el valor no solape con la etiqueta.
  ctx.y += 9
  // Valor (puede ocupar varias líneas).
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  setText(doc, SLATE)
  lines.forEach((ln) => {
    ensureSpace(ctx, 4.8)
    doc.text(ln, M + 1, ctx.y)
    ctx.y += 4.8
  })
  ctx.y += 3
}

function diagnosisBox(ctx: Ctx, label: string, code: string, probability: number) {
  const { doc } = ctx
  const boxH = 16
  ensureSpace(ctx, boxH + 2)
  const badge = BADGE[code] ?? { fill: ZEBRA, text: SLATE }
  setFill(doc, badge.fill)
  setDraw(doc, LINE)
  doc.setLineWidth(0.2)
  doc.roundedRect(M, ctx.y, CW, boxH, 2, 2, 'FD')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  setText(doc, MUTED)
  doc.text('Diagnóstico estimado', M + 4, ctx.y + 6)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  setText(doc, badge.text)
  doc.text(label, M + 4, ctx.y + 12.5)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(`${probability}%`, PW - M - 4, ctx.y + 10, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  setText(doc, MUTED)
  doc.text('confianza', PW - M - 4, ctx.y + 14, { align: 'right' })
  ctx.y += boxH + 4
}

/** Barras horizontales proporcionales (probabilidades por clase). */
function barRow(ctx: Ctx, label: string, fraction: number, valueText: string) {
  const { doc } = ctx
  const rowH = 6.5
  ensureSpace(ctx, rowH)
  const labelW = 46
  const barX = M + labelW
  const barW = CW - labelW - 22
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  setText(doc, SLATE)
  doc.text(doc.splitTextToSize(label, labelW - 2)[0] as string, M + 1, ctx.y + 4)
  setFill(doc, [226, 232, 240])
  doc.roundedRect(barX, ctx.y + 1, barW, 3.5, 1, 1, 'F')
  const w = Math.max(0.5, Math.min(1, fraction) * barW)
  setFill(doc, TEAL)
  doc.roundedRect(barX, ctx.y + 1, w, 3.5, 1, 1, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  setText(doc, MUTED)
  doc.text(valueText, PW - M - 1, ctx.y + 4, { align: 'right' })
  ctx.y += rowH
}

function bulletList(ctx: Ctx, items: string[]) {
  const { doc } = ctx
  doc.setFontSize(8.5)
  items.forEach((item) => {
    const lines = doc.splitTextToSize(item, CW - 8) as string[]
    ensureSpace(ctx, lines.length * 4.5 + 1.5)
    setFill(doc, TEAL)
    doc.circle(M + 2, ctx.y + 1.5, 0.8, 'F')
    setText(doc, SLATE)
    doc.setFont('helvetica', 'normal')
    lines.forEach((ln, idx) => {
      doc.text(ln, M + 6, ctx.y + 2.5 + idx * 4.5)
    })
    ctx.y += lines.length * 4.5 + 1.5
  })
  ctx.y += 2
}

function programsLabel(c: AgentRunReport['case']): string {
  const progr = [
    c.Juntos ? 'Juntos' : '',
    c.SIS ? 'SIS' : '',
    c.Qaliwarma ? 'Qali Warma' : '',
    c.Cred ? 'CRED' : '',
    c.Suplementacion ? 'Suplementación Fe' : '',
    c.Consejeria ? 'Consejería' : '',
    c.Sesion ? 'Sesión demostrativa' : '',
  ].filter(Boolean)
  return progr.length ? progr.join(', ') : 'Ninguno registrado'
}

function topFactors(report: AgentRunReport): XaiFactor[] {
  const ex = report.explainability
  if (!ex) return []
  const global = ex.shap?.global ?? []
  const local = ex.shap?.local?.factors ?? ex.lime?.factors ?? []
  return (global.length ? global : local).slice(0, 6)
}

/**
 * Construye el documento clínico vectorial y devuelve el `jsPDF` junto al
 * nombre de archivo sugerido. `jsPDF` se importa dinámicamente para no
 * inflar el bundle inicial.
 */
export async function buildClinicalPdf(
  report: AgentRunReport,
): Promise<{ doc: JsPDF; fname: string }> {
  const { jsPDF } = await import(/* webpackChunkName: "jspdf" */ 'jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const pre = report.preprocessing
  const pred = report.prediction
  const rec = report.recommendation
  const mon = report.monitoring
  const c = report.case

  const ctx: Ctx = { doc, y: CONTENT_TOP, page: 1 }
  drawHeader(doc)

  // Metadatos de cabecera del reporte
  const fecha = new Date(report.generated_at).toLocaleString('es-PE', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  setText(doc, MUTED)
  doc.text(`Generado: ${fecha}`, M, ctx.y)
  if (report.run_id) doc.text(`ID: ${report.run_id}`, PW - M, ctx.y, { align: 'right' })
  ctx.y += 7

  // 1 · Establecimiento
  sectionTitle(ctx, 'Establecimiento de Salud')
  kvGrid(ctx, [
    ['Provincia EESS', c.Prov_EESS || '—'],
    ['Distrito EESS', c.Dist_EESS || '—'],
  ])

  // 2 · Datos del paciente
  sectionTitle(ctx, 'Datos del Paciente')
  kvGrid(ctx, [
    ['Sexo', c.Sexo === 'F' ? 'Femenino' : 'Masculino'],
    ['Edad', `${c.EdadMeses} meses`],
    ['Provincia REN', c.ProvinciaREN || '—'],
    ['Distrito REN', c.DistritoREN || '—'],
    ['Altitud residencia', `${c.AlturaREN} m.s.n.m.`],
  ])

  // 3 · Programas
  sectionTitle(ctx, 'Programas y Controles')
  fullRow(ctx, 'Programas sociales y controles registrados', programsLabel(c))

  // 4 · Evaluación clínica (Hbc)
  if (pre) {
    sectionTitle(ctx, 'Evaluación Clínica · Hemoglobina Corregida')
    kvGrid(ctx, [
      ['Hemoglobina observada', `${pre.hb_observed} g/dL`],
      ['Ajuste por altitud', `${pre.adjustment} g/dL`],
      ['Hemoglobina corregida (Hbc)', `${pre.hbc} g/dL`],
      ['Altitud de referencia', `${pre.altitude_m} m.s.n.m.`],
    ])
    fullRow(ctx, 'Marco normativo', pre.normative_framework)
  }

  // 5 · Resultado ML
  if (pred) {
    sectionTitle(ctx, 'Resultado del Modelo de Machine Learning')
    diagnosisBox(ctx, pred.diagnosis_label, pred.diagnosis_code, pred.probability)
    kvGrid(ctx, [['Modelo utilizado', pred.model]])
    if (pred.class_probabilities && Object.keys(pred.class_probabilities).length) {
      ctx.y += 1
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      setText(doc, MUTED)
      ensureSpace(ctx, 6)
      doc.text('Probabilidades por clase', M + 1, ctx.y + 3)
      ctx.y += 6
      Object.entries(pred.class_probabilities).forEach(([cls, prob]) => {
        barRow(ctx, cls, prob, `${(prob * 100).toFixed(1)}%`)
      })
      ctx.y += 2
    }
  }

  // 6 · Explicabilidad (XAI)
  const factors = topFactors(report)
  if (factors.length) {
    sectionTitle(ctx, 'Explicabilidad (XAI · SHAP / LIME)')
    // Encabezado de la lista. El factor principal ya encabeza las barras
    // (peso 1.00), así que no se repite como valor aparte.
    if (report.explainability?.top_factor) {
      ensureSpace(ctx, 6)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      setText(doc, MUTED)
      doc.text('Factor más influyente', M + 1, ctx.y + 3)
      ctx.y += 6
    }
    const maxNorm = Math.max(...factors.map((f) => f.weight_norm || 0), 0.01)
    factors.forEach((f) => {
      barRow(ctx, f.label, f.weight_norm / maxNorm, f.weight_norm.toFixed(2))
    })
    ctx.y += 2
  }

  // 7 · Recomendaciones
  if (rec) {
    sectionTitle(ctx, 'Recomendación Referencial')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    setText(doc, INK)
    ensureSpace(ctx, 6)
    doc.text(doc.splitTextToSize(rec.title, CW)[0] as string, M + 1, ctx.y + 3)
    ctx.y += 7
    bulletList(ctx, rec.items)
    if (rec.source) fullRow(ctx, 'Fuente', rec.source)
  }

  // 8 · Observaciones / auditoría
  sectionTitle(ctx, 'Observaciones')
  if (mon) {
    kvGrid(ctx, [
      // Incluye al agente Coordinador (Monitoring): el backend cuenta solo los
      // 5 previos en `agents_run`, por lo que usamos el total de logs (6).
      ['Agentes ejecutados', String(report.agent_logs?.length ?? mon.agents_run)],
      ['Tiempo total', `${mon.total_elapsed_ms} ms`],
      ['Estado del pipeline', mon.status],
      ['Errores', String(mon.errors)],
    ])
  }
  fullRow(
    ctx,
    'Nota',
    'Este reporte fue generado automáticamente por un prototipo de investigación. Toda decisión médica debe ser tomada por personal de salud autorizado, considerando la evaluación clínica integral del paciente.',
  )

  // Pies con numeración total
  const total = doc.getNumberOfPages()
  for (let p = 1; p <= total; p++) {
    doc.setPage(p)
    drawFooter(doc, p, total)
  }

  const dist = c.DistritoREN || c.Dist_EESS || 'Puno'
  const fname = `AnemIA_Reporte_${dist}_${new Date().toISOString().slice(0, 10)}.pdf`
  return { doc, fname }
}

/** Construye y descarga el PDF clínico. Devuelve el nombre de archivo. */
export async function generateClinicalPdf(report: AgentRunReport): Promise<string> {
  const { doc, fname } = await buildClinicalPdf(report)
  doc.save(fname)
  return fname
}

/** Abre el PDF en una pestaña nueva y lanza el diálogo de impresión. */
export async function printClinicalPdf(report: AgentRunReport): Promise<void> {
  const { doc } = await buildClinicalPdf(report)
  doc.autoPrint()
  const url = doc.output('bloburl')
  window.open(url as unknown as string, '_blank')
}
