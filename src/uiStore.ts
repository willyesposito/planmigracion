import { create } from 'zustand'

export type Vista = 'timeline' | 'insights'
export type Modal = null | 'equipo' | 'cuenta'

/** Estado efímero de UI (NO se persiste, igual que en el prototipo). */
interface UIState {
  vista: Vista
  mostrarCarga: boolean
  mostrarDep: boolean
  modal: Modal
  resumenAbierto: boolean

  setVista: (v: Vista) => void
  toggleCarga: () => void
  toggleDep: () => void
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

  setVista: (vista) => set({ vista }),
  toggleCarga: () => set(s => ({ mostrarCarga: !s.mostrarCarga })),
  toggleDep: () => set(s => ({ mostrarDep: !s.mostrarDep })),
  abrirModal: (modal) => set({ modal }),
  cerrarModal: () => set({ modal: null }),
  setResumen: (resumenAbierto) => set({ resumenAbierto }),
}))
