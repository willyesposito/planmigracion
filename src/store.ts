import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Asignacion, Config, Persona, Proyecto, Violacion } from './types'
import { calcularFin } from './utils/dates'
import { computeViolaciones as _computeViolaciones } from './rules'
import personasRaw from '../data/personas.json'
import proyectosRaw from '../data/proyectos.json'
import asignacionesRaw from '../data/asignaciones.json'
import configRaw from '../data/config.json'



const seedPersonas = personasRaw.personas as Persona[]
const seedProyectos = proyectosRaw.proyectos as Proyecto[]
const seedAsignaciones = asignacionesRaw.asignaciones as Asignacion[]
const seedConfig = configRaw as unknown as Config

interface SimuladorState {
  personas: Persona[]
  proyectos: Proyecto[]
  asignaciones: Asignacion[]
  config: Config
  violaciones: Violacion[]
  clienteSeleccionado: string | null

  updateAsignacion: (id: string, patch: Partial<Asignacion>) => void
  updateConfigFecha: (key: 'transicion_susana_toyota' | 'retro_ready_axton', value: string | null) => void
  seleccionarCliente: (proyectoId: string | null) => void
  resetToSeed: () => void
  exportarJSON: () => string
  importarJSON: (json: string) => void
}

function recompute(
  asignaciones: Asignacion[],
  proyectos: Proyecto[],
  personas: Persona[],
  config: Config,
): Violacion[] {
  return _computeViolaciones(asignaciones, proyectos, personas, config)
}

export const useSimuladorStore = create<SimuladorState>()(
  persist(
    (set, get) => ({
      personas: seedPersonas,
      proyectos: seedProyectos,
      asignaciones: seedAsignaciones,
      config: seedConfig,
      violaciones: recompute(seedAsignaciones, seedProyectos, seedPersonas, seedConfig),
      clienteSeleccionado: null,

      updateAsignacion(id, patch) {
        set(state => {
          const asignaciones = state.asignaciones.map(a => {
            if (a.id !== id) return a
            const updated = { ...a, ...patch }
            if ('duracion_dias' in patch || 'inicio' in patch) {
              updated.fin = calcularFin(updated.inicio, updated.duracion_dias)
            }
            return updated
          })
          return {
            asignaciones,
            violaciones: recompute(asignaciones, state.proyectos, state.personas, state.config),
          }
        })
      },

      updateConfigFecha(key, value) {
        set(state => {
          const config: Config = {
            ...state.config,
            fechas_clave: { ...state.config.fechas_clave, [key]: value },
          }
          return {
            config,
            violaciones: recompute(state.asignaciones, state.proyectos, state.personas, config),
          }
        })
      },

      seleccionarCliente(proyectoId) {
        set({ clienteSeleccionado: proyectoId })
      },

      resetToSeed() {
        set({
          personas: seedPersonas,
          proyectos: seedProyectos,
          asignaciones: seedAsignaciones,
          config: seedConfig,
          violaciones: [],
          clienteSeleccionado: null,
        })
      },

      exportarJSON() {
        const { personas, proyectos, asignaciones, config } = get()
        return JSON.stringify({ personas, proyectos, asignaciones, config }, null, 2)
      },

      importarJSON(json) {
        const data = JSON.parse(json) as Partial<SimuladorState>
        const personas = (data.personas as Persona[]) ?? seedPersonas
        const proyectos = (data.proyectos as Proyecto[]) ?? seedProyectos
        const asignaciones = (data.asignaciones as Asignacion[]) ?? seedAsignaciones
        const config = (data.config as Config) ?? seedConfig
        set({
          personas,
          proyectos,
          asignaciones,
          config,
          violaciones: recompute(asignaciones, proyectos, personas, config),
          clienteSeleccionado: null,
        })
      },
    }),
    {
      name: 'simulador-ha-v1',
      partialize: state => ({
        asignaciones: state.asignaciones,
        config: state.config,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.violaciones = recompute(state.asignaciones, state.proyectos, state.personas, state.config)
        }
      },
    },
  ),
)
