import { useCallback, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  FlaskConical, Loader2, MapPin, Send, User, Shield, TestTube, Home, Cpu, Trees, Zap,
  type LucideIcon,
} from 'lucide-react'

import type { ClinicalFormData } from '../../types'
import { getAltitud, getDistritos, provincias } from '../../data/puno'
import { BrandMark } from '../brand/BrandLogo'

interface Props {
  value: ClinicalFormData
  onChange: (patch: Partial<ClinicalFormData>) => void
  onSubmit: () => void
  onLoadExample: () => void
  loading?: boolean
}

export default function ClinicalFormCard({ value, onChange, onSubmit, onLoadExample, loading }: Props) {
  const [errors, setErrors] = useState<string[]>([])
  const formRef = useRef<HTMLDivElement>(null)

  const distritosEESS = value.Prov_EESS ? getDistritos(value.Prov_EESS) : []
  const distritosREN = value.ProvinciaREN ? getDistritos(value.ProvinciaREN) : []

  const handleProvEESS = useCallback((prov: string) => {
    onChange({ Prov_EESS: prov, Dist_EESS: '' })
  }, [onChange])

  const handleProvREN = useCallback((prov: string) => {
    const alt = getAltitud(prov)
    onChange({ ProvinciaREN: prov, DistritoREN: '', AlturaREN: alt ?? 0 })
  }, [onChange])

  const handleDistREN = useCallback((dist: string) => {
    const alt = getAltitud(dist)
    onChange({ DistritoREN: dist, AlturaREN: alt ?? 0 })
  }, [onChange])

  const toggle = (field: keyof ClinicalFormData) => {
    onChange({ [field]: value[field] === 1 ? 0 : 1 } as any)
  }

  const validate = (): boolean => {
    const errs: string[] = []
    if (!value.Prov_EESS) errs.push('Provincia EESS')
    if (!value.Dist_EESS) errs.push('Distrito EESS')
    if (!value.EdadMeses || value.EdadMeses <= 0) errs.push('Edad en meses')
    if (!value.Hemoglobina || value.Hemoglobina <= 0) errs.push('Hemoglobina')
    if (!value.ProvinciaREN) errs.push('Provincia REN')
    if (!value.DistritoREN) errs.push('Distrito REN')
    if (!value.AlturaREN || value.AlturaREN <= 0) errs.push('Altitud de residencia')
    setErrors(errs)
    if (errs.length > 0) {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    return errs.length === 0
  }

  const handleSubmit = () => {
    if (validate()) onSubmit()
  }

  return (
    <motion.div
      ref={formRef}
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="surface overflow-hidden"
      role="form"
      aria-label="Formulario de caso clínico"
    >
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3 dark:border-white/10">
        <BrandMark size={26} animated={false} idle={false} />
        <div className="min-w-0">
          <p className="text-sm font-bold leading-tight text-slate-800 dark:text-slate-100">Registro clínico</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Completa los datos del caso</p>
        </div>
        <span className="chip ml-auto bg-teal-50 text-teal-700 ring-1 ring-teal-100 dark:bg-teal-500/15 dark:text-teal-300 dark:ring-teal-400/20">Agente 1</span>
      </div>

      <div className="space-y-1 p-4">
        <SectionTitle icon={MapPin} text="Establecimiento de salud" />
        <div className="grid grid-cols-2 gap-2">
          <SelectField label="Provincia EESS" value={value.Prov_EESS} options={provincias} onChange={handleProvEESS} disabled={loading} />
          <SelectField
            label="Distrito EESS"
            value={value.Dist_EESS}
            options={distritosEESS}
            onChange={(v) => onChange({ Dist_EESS: v })}
            placeholder={value.Prov_EESS ? 'Seleccionar…' : 'Elige provincia'}
            disabled={loading}
          />
        </div>

        <SectionTitle icon={User} text="Datos del niño/a" />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <FieldLabel>Sexo</FieldLabel>
            <select className="input text-xs" value={value.Sexo} onChange={(e) => onChange({ Sexo: e.target.value as 'F' | 'M' })} disabled={loading}>
              <option value="F">Femenino (F)</option>
              <option value="M">Masculino (M)</option>
            </select>
          </div>
          <InputField label="Edad (meses)" value={value.EdadMeses} onChange={(v) => onChange({ EdadMeses: parseFloat(v) || 0 })} type="number" step="0.01" placeholder="ej. 53.62" disabled={loading} mono />
        </div>

        <SectionTitle icon={Shield} text="Programas y controles sociales" />
        <div className="grid grid-cols-2 gap-x-3">
          <ToggleRow checked={value.Juntos === 1} onToggle={() => toggle('Juntos')} label="Juntos" disabled={loading} />
          <ToggleRow checked={value.SIS === 1} onToggle={() => toggle('SIS')} label="SIS" disabled={loading} />
          <ToggleRow checked={value.Qaliwarma === 1} onToggle={() => toggle('Qaliwarma')} label="Qali Warma" disabled={loading} />
          <ToggleRow checked={value.Cred === 1} onToggle={() => toggle('Cred')} label="Control CRED" disabled={loading} />
          <ToggleRow checked={value.Suplementacion === 1} onToggle={() => toggle('Suplementacion')} label="Suplementación Fe" disabled={loading} />
          <ToggleRow checked={value.Consejeria === 1} onToggle={() => toggle('Consejeria')} label="Consejería" disabled={loading} />
          <ToggleRow checked={value.Sesion === 1} onToggle={() => toggle('Sesion')} label="Sesión demostrativa" disabled={loading} />
        </div>

        <SectionTitle icon={TestTube} text="Datos clínicos" />
        <InputField label="Hemoglobina observada (g/dL)" value={value.Hemoglobina} onChange={(v) => onChange({ Hemoglobina: parseFloat(v) || 0 })} type="number" step="0.1" placeholder="ej. 13.7" suffix="g/dL" disabled={loading} mono />

        <SectionTitle icon={Home} text="Residencia del niño (REN)" />
        <div className="grid grid-cols-2 gap-2">
          <SelectField label="Provincia REN" value={value.ProvinciaREN} options={provincias} onChange={handleProvREN} disabled={loading} />
          <SelectField
            label="Distrito REN"
            value={value.DistritoREN}
            options={distritosREN}
            onChange={handleDistREN}
            placeholder={value.ProvinciaREN ? 'Seleccionar…' : 'Elige provincia'}
            disabled={loading}
          />
        </div>
        <InputField label="Altitud residencia (m.s.n.m.)" value={value.AlturaREN} onChange={(v) => onChange({ AlturaREN: parseFloat(v) || 0 })} type="number" step="1" placeholder="Automático" suffix="msnm" disabled={loading} mono />

        <SectionTitle icon={Cpu} text="Modelo de Machine Learning" />
        <div className="grid grid-cols-2 gap-2">
          <ModelOption active={value.Modelo === 'random_forest'} onClick={() => onChange({ Modelo: 'random_forest' })} icon={Trees} label="Random Forest" disabled={loading} />
          <ModelOption active={value.Modelo === 'xgboost'} onClick={() => onChange({ Modelo: 'xgboost' })} icon={Zap} label="XGBoost" disabled={loading} />
        </div>

        <div className="flex flex-col gap-2 pt-3">
          {errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[10px] text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
              role="alert"
            >
              <strong>Campos obligatorios:</strong> {errors.join(', ')}
            </motion.div>
          )}
          <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full py-2.5 text-sm">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {loading ? 'Procesando…' : 'Analizar caso con agentes'}
          </button>
          <button onClick={onLoadExample} disabled={loading} className="btn-ghost w-full py-2 text-xs">
            <FlaskConical size={13} /> Cargar caso ejemplo (Juliaca)
          </button>
        </div>
      </div>
    </motion.div>
  )
}

/* — Subcomponentes a nivel de módulo (evita remontaje y pérdida de foco) — */

function SectionTitle({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="mb-2.5 mt-4 flex items-center gap-2 first:mt-0">
      <Icon size={12} className="text-teal-600 dark:text-teal-400" aria-hidden="true" />
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">{text}</span>
      <span className="h-px flex-1 bg-slate-100 dark:bg-white/10" aria-hidden="true" />
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{children}</label>
}

function SelectField({
  label, value, options, onChange, placeholder, disabled,
}: { label: string; value: string; options: string[]; onChange: (v: string) => void; placeholder?: string; disabled?: boolean }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <select
        className={`input text-xs ${value ? 'text-slate-800' : 'text-slate-400'}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">{placeholder || 'Seleccionar…'}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}

function InputField({
  label, value, onChange, type = 'text', step, placeholder, suffix, disabled, mono,
}: { label: string; value: string | number; onChange: (v: string) => void; type?: string; step?: string; placeholder?: string; suffix?: string; disabled?: boolean; mono?: boolean }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <input
          type={type}
          step={step}
          className={`input text-xs ${suffix ? 'pr-12' : ''} ${mono ? 'font-data' : ''}`}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
        />
        {suffix && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-slate-400">{suffix}</span>}
      </div>
    </div>
  )
}

function ToggleRow({
  checked, onToggle, label, disabled,
}: { checked: boolean; onToggle: () => void; label: string; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg px-1.5 py-1.5 transition hover:bg-slate-50 dark:hover:bg-white/5">
      <span className="text-xs text-slate-700 dark:text-slate-300">{label}</span>
      <label className="relative inline-block h-5 w-9 flex-shrink-0 cursor-pointer" aria-label={label}>
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={onToggle} disabled={disabled} />
        <span className="absolute inset-0 rounded-full bg-slate-300 transition peer-checked:bg-teal-600 peer-focus-visible:ring-2 peer-focus-visible:ring-teal-500 peer-focus-visible:ring-offset-1 dark:bg-slate-600 dark:peer-focus-visible:ring-offset-slate-800" />
        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-4" />
      </label>
    </div>
  )
}

function ModelOption({
  active, onClick, icon: Icon, label, disabled,
}: { active: boolean; onClick: () => void; icon: LucideIcon; label: string; disabled?: boolean }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition disabled:opacity-50 ${
        active
          ? 'border-teal-500 bg-teal-50 text-teal-700 ring-1 ring-teal-200 dark:border-teal-400/40 dark:bg-teal-500/15 dark:text-teal-300 dark:ring-teal-400/20'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
      }`}
    >
      <Icon size={15} className={active ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'} aria-hidden="true" />
      {label}
    </motion.button>
  )
}
