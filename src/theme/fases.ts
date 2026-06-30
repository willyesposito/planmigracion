import type { TipoFase } from '../types'

/**
 * Colores por tipo de fase. Fuente única (la consumen Timeline y ClientPanel,
 * antes estaban duplicados y se habían desincronizado en Vacaciones).
 * Los valores viven como tokens del H&A Design System en index.css (var(--fase-*)),
 * nunca vendor colors (ej. el azul de Monday #579bfc quedó descartado).
 */
export const TIPO_COLOR: Record<TipoFase, string> = {
  Relevamiento: 'var(--fase-relev)',
  Configuracion: 'var(--fase-config)',
  Pruebas: 'var(--fase-pruebas)',
  Vacaciones: 'var(--fase-bloqueo)',
}

export const TIPO_LABEL: Record<TipoFase, string> = {
  Relevamiento: 'Relevamiento',
  Configuracion: 'Configuración',
  Pruebas: 'Pruebas',
  Vacaciones: 'Vacaciones',
}

/** Orden canónico de las 3 fases estándar (excluye bloqueos/vacaciones). */
export const ORDEN_FASES: TipoFase[] = ['Relevamiento', 'Configuracion', 'Pruebas']
