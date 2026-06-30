import { create } from 'zustand'

export type Vista = 'timeline' | 'insights'
export type Modal = null | 'equipo' | 'cuenta'
export type ZoomLevel = 'dias' | 'semanas' | 'meses' | 'trimestres'
export type SortCuentas = 'fecha' | 'nombre'
/** flexible = arrastrar mueve solo la tarea · estricto = mueve las 3 fases del proyecto juntas */
export type ModoMovimiento = 'flexible' | 'estricto'

interface UIState {
  vista: Vista
  mostrarCarga: boolean
  mostrarDep: boolean
  modal: Modal
  resumenAbierto: boolean
  timelineFull: boolean
  zoom: ZoomLevel
  sortCuentas: SortCuentas
  irHoyToken: number
  modoMovimiento: ModoMovimiento

  setVista: (v: Vista) => void
  toggleCarga: () => void
  toggleDep: () => void
  toggleTimelineFull: () => void
  setZoom: (z: ZoomLevel) => void
  toggleSortCuentas: () => void
  irHoy: () => void
  setModoMovimiento: (m: ModoMovimiento) => void
  abrirModal: (m: Exclude<Modal, null>) => void
  cerrarModal: () => void
  setResumen: (abierto: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  vista: 'timeline',
  mostrarCarga: true,
  mostrarDep: true,
  modal: null,
  resumenAbierto: false,
  timelineFull: false,
  zoom: 'semanas',
  sortCuentas: 'fecha',
  irHoyToken: 0,
  modoMovimiento: 'flexible',

  setVista: (vista) => set({ vista }),
  toggleCarga: () => set(s => ({ mostrarCarga: !s.mostrarCarga })),
  toggleDep: () => set(s => ({ mostrarDep: !s.mostrarDep })),
  toggleTimelineFull: () => set(s => ({ timelineFull: !s.timelineFull })),
  setZoom: (zoom) => set({ zoom }),
  toggleSortCuentas: () => set(s => ({ sortCuentas: s.sortCuentas === 'fecha' ? 'nombre' : 'fecha' })),
  irHoy: () => set(s => ({ irHoyToken: s.irHoyToken + 1 })),
  setModoMovimiento: (modoMovimiento) => set({ modoMovimiento }),
  abrirModal: (modal) => set({ modal }),
  cerrarModal: () => set({ modal: null }),
  setResumen: (resumenAbierto) => set({ resumenAbierto }),
}))
