import type { ClinicalCase } from '../types'

// Caso de ejemplo precargado (niña de Juliaca) — idéntico al prototipo.
export const exampleCase: ClinicalCase = {
  Prov_EESS: 'SANROMAN',
  Dist_EESS: 'JULIACA',
  Sexo: 'F',
  EdadMeses: 53.62,
  Juntos: 0,
  SIS: 1,
  Qaliwarma: 0,
  Cred: 1,
  Suplementacion: 1,
  Consejeria: 0,
  Sesion: 0,
  Hemoglobina: 13.7,
  ProvinciaREN: 'SANROMAN',
  DistritoREN: 'JULIACA',
  AlturaREN: 3877,
}

export const emptyCase: ClinicalCase = {
  Prov_EESS: '',
  Dist_EESS: '',
  Sexo: 'F',
  EdadMeses: 0,
  Juntos: 0,
  SIS: 0,
  Qaliwarma: 0,
  Cred: 0,
  Suplementacion: 0,
  Consejeria: 0,
  Sesion: 0,
  Hemoglobina: 0,
  ProvinciaREN: '',
  DistritoREN: '',
  AlturaREN: 0,
}

export const diagnosisColors: Record<string, string> = {
  Normal: '#16a34a',
  AnemiaLeve: '#d97706',
  AnemiaModerada: '#ea580c',
  AnemiaSevera: '#dc2626',
}
