export type TipoFase = 'Relevamiento' | 'Configuracion' | 'Pruebas' | 'Vacaciones'

export interface Persona {
  id: string
  alias: string
  skills: string[]
  capacidad_horas_semana: number
  buffer_pct: number
  _nota?: string
}

export interface Proyecto {
  id: string
  nombre: string
  complejidad: number | null
  depende_retro: boolean | null
  entidades: number
  quick_win: boolean
  especial: boolean
  _nota?: string
}

export interface Asignacion {
  id: string
  proyecto_id: string | null
  tipo: TipoFase
  persona_id: string
  inicio: string   // ISO date YYYY-MM-DD
  fin: string      // ISO date YYYY-MM-DD
  duracion_dias: number
  dedicacion_pct: number
  predecesoras: string[]
  es_bloqueo: boolean
  _nombre?: string // nombre libre para bloques especiales
}

export interface Config {
  unidades: {
    horas_por_dia: number
    dias_por_semana: number
  }
  fechas_clave: {
    transicion_susana_toyota: string | null
    retro_ready_axton: string | null
  }
  pisos_soporte_horas_semana: Record<string, number | null>
  feriados_nacionales_2026: Array<{ fecha: string; nombre: string }>
  horizonte: {
    desde: string
    hasta: string
  }
}

export type SeveridadViolacion = 'rojo' | 'ambar'
export type TipoRegla = 'R1' | 'R2' | 'R3'

export interface Violacion {
  tipo: TipoRegla
  asignacion_id: string
  persona_id?: string
  semana?: string  // YYYY-MM-DD lunes de la semana afectada
  mensaje: string
  severidad: SeveridadViolacion
}

export interface EstadoAsignacion {
  asignacion_id: string
  violaciones: Violacion[]
  color: 'verde' | 'ambar' | 'rojo'
}
