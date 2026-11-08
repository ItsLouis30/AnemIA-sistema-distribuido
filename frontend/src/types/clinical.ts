export interface ClinicalFormData {
  Prov_EESS: string
  Dist_EESS: string
  Establecimiento: string
  EdadMeses: number
  Sexo: 'F' | 'M'
  Juntos: number
  SIS: number
  Qaliwarma: number
  Cred: number
  Suplementacion: number
  Consejeria: number
  Sesion: number
  Hemoglobina: number
  ProvinciaREN: string
  DistritoREN: string
  AlturaREN: number
  Modelo: 'random_forest' | 'xgboost'
}

export const defaultClinicalForm: ClinicalFormData = {
  Prov_EESS: '',
  Dist_EESS: '',
  Establecimiento: '',
  EdadMeses: 0,
  Sexo: 'F',
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
  Modelo: 'random_forest',
}

export const ejemploJuliaca: ClinicalFormData = {
  Prov_EESS: 'SANROMAN',
  Dist_EESS: 'JULIACA',
  Establecimiento: 'Hospital Carlos Monge Medrano',
  EdadMeses: 53.62,
  Sexo: 'F',
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
  Modelo: 'random_forest',
}
