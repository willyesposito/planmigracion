import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { addDays, addWeeks, parseISO } from 'date-fns'
import type { Asignacion, Config, Persona, Proyecto, RolPersona, TipoFase, Violacion } from './types'
import { calcularFin, getMondayOfWeek, toISO } from './utils/dates'
import { computeViolaciones as _computeViolaciones } from './rules'
import personasRaw from '../data/personas.json'
import proyectosRaw from '../data/proyectos.json'
import asignacionesRaw from '../data/asignaciones.json'
import configRaw from '../data/config.json'



const seedPersonas = personasRaw.personas as Persona[]
const seedProyectos = proyectosRaw.proyectos as Proyecto[]
const seedAsignaciones = asignacionesRaw.asignaciones as Asignacion[]
const seedConfig = configRaw as unknown as Config

// ---------- helpers ----------

/** alias → id seguro (sin acentos, sin espacios). Garantiza unicidad contra los ya usados. */
function slugUnico(texto: string, existentes: Set<string>): string {
  const base = texto
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // saca acentos
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'item'
  let id = base
  let n = 2
  while (existentes.has(id)) id = `${base}_${n++}`
  return id
}

/**
 * Elige una persona para una fase: primero por rol explícito; si no hay, por skill real
 * (NO inventa clasificación: usa lo que el dataset ya tiene). Cae a la primera persona
 * solo si no encuentra candidato.
 */
function pickPersona(personas: Persona[], tipo: TipoFase): string {
  const rolDe: Partial<Record<TipoFase, RolPersona>> = {
    Relevamiento: 'relevamiento', Configuracion: 'configuracion', Pruebas: 'pruebas',
  }
  const skillDe: Partial<Record<TipoFase, string[]>> = {
    Relevamiento: ['relevamiento'], Configuracion: ['configuracion'], Pruebas: ['pruebas', 'testeo'],
  }
  const porRol = personas.find(p => p.rol && p.rol === rolDe[tipo])
  if (porRol) return porRol.id
  const skills = skillDe[tipo] ?? []
  const porSkill = personas.find(p => p.skills?.some(s => skills.includes(s)))
  if (porSkill) return porSkill.id
  return personas[0]?.id ?? ''
}

/** Lunes de la semana siguiente al fin de una fase (ISO). Encadena fases sin violar R3. */
function siguienteLunes(finISO: string): string {
  return toISO(addWeeks(getMondayOfWeek(parseISO(finISO)), 1))
}

// Duración por defecto (días hábiles) de las 3 fases de una cuenta nueva.
const DUR_DEFAULT: Record<'Relevamiento' | 'Configuracion' | 'Pruebas', number> = {
  Relevamiento: 10, Configuracion: 15, Pruebas: 8,
}

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
  shiftAccount: (proyectoId: string, semanas: number) => void
  addPersona: (alias: string, rol: RolPersona | null) => void
  removePersona: (id: string) => { ok: boolean; motivo?: string }
  addProyecto: (nombre: string, inicio: string) => string
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

      // Mueve TODAS las fases de una cuenta N semanas (±), recalculando fin por días hábiles.
      // Clampea para no salir antes del inicio del horizonte. Recalcula reglas una sola vez.
      shiftAccount(proyectoId, semanas) {
        set(state => {
          const projAsigs = state.asignaciones.filter(a => a.proyecto_id === proyectoId)
          if (projAsigs.length === 0) return {}
          let dias = semanas * 7
          if (dias < 0) {
            const earliest = projAsigs.reduce((m, a) => (a.inicio < m ? a.inicio : m), projAsigs[0].inicio)
            const earliestMonday = getMondayOfWeek(parseISO(earliest))
            const desdeMonday = getMondayOfWeek(parseISO(state.config.horizonte.desde))
            const maxLeftDias = Math.round((desdeMonday.getTime() - earliestMonday.getTime()) / 86400000)
            dias = Math.max(dias, maxLeftDias) // no pasar de la semana 0
          }
          if (dias === 0) return {}
          const asignaciones = state.asignaciones.map(a => {
            if (a.proyecto_id !== proyectoId) return a
            const inicio = toISO(addDays(parseISO(a.inicio), dias))
            return { ...a, inicio, fin: calcularFin(inicio, a.duracion_dias) }
          })
          return {
            asignaciones,
            violaciones: recompute(asignaciones, state.proyectos, state.personas, state.config),
          }
        })
      },

      // Alta de recurso: SOLO alias + rol (enum). Nunca nombres reales/PII (regla dura CLAUDE.md §5).
      addPersona(alias, rol) {
        const aliasLimpio = alias.trim()
        if (!aliasLimpio) return
        set(state => {
          const ids = new Set(state.personas.map(p => p.id))
          const persona: Persona = {
            id: slugUnico(aliasLimpio, ids),
            alias: aliasLimpio,
            skills: [],
            rol: rol ?? null,
            capacidad_horas_semana: 40,
            buffer_pct: 0,
            custom: true,
          }
          return { personas: [...state.personas, persona] }
        })
      },

      // No permite borrar a alguien con fases asignadas.
      removePersona(id) {
        const enUso = get().asignaciones.some(a => a.persona_id === id)
        if (enUso) return { ok: false, motivo: 'Tiene fases asignadas; reasignalas o quitalas primero.' }
        set(state => {
          const personas = state.personas.filter(p => p.id !== id)
          return {
            personas,
            violaciones: recompute(state.asignaciones, state.proyectos, personas, state.config),
          }
        })
        return { ok: true }
      },

      // Crea una cuenta + 3 fases encadenadas (Relev→Config→Pruebas) autoasignadas por rol/skill.
      // Respeta los null del dataset: complejidad y depende_retro quedan sin definir.
      addProyecto(nombre, inicio) {
        const nombreLimpio = nombre.trim()
        const inicioMonday = toISO(getMondayOfWeek(parseISO(inicio)))
        let nuevoId = ''
        set(state => {
          const idsP = new Set(state.proyectos.map(p => p.id))
          const pid = slugUnico(nombreLimpio || 'cuenta', idsP)
          nuevoId = pid
          const proyecto: Proyecto = {
            id: pid,
            nombre: nombreLimpio || pid,
            complejidad: null,
            depende_retro: null,
            entidades: 1,
            quick_win: false,
            especial: false,
            custom: true,
          }

          const relevInicio = inicioMonday
          const relevFin = calcularFin(relevInicio, DUR_DEFAULT.Relevamiento)
          const configInicio = siguienteLunes(relevFin)
          const configFin = calcularFin(configInicio, DUR_DEFAULT.Configuracion)
          const pruebasInicio = siguienteLunes(configFin)
          const pruebasFin = calcularFin(pruebasInicio, DUR_DEFAULT.Pruebas)

          const mk = (
            sufijo: string, tipo: TipoFase, ini: string, fin: string, dur: number, preds: string[],
          ): Asignacion => ({
            id: `${pid}-${sufijo}`,
            proyecto_id: pid,
            tipo,
            persona_id: pickPersona(state.personas, tipo),
            inicio: ini,
            fin,
            duracion_dias: dur,
            dedicacion_pct: 1,
            predecesoras: preds,
            es_bloqueo: false,
          })

          const nuevas: Asignacion[] = [
            mk('relev', 'Relevamiento', relevInicio, relevFin, DUR_DEFAULT.Relevamiento, []),
            mk('config', 'Configuracion', configInicio, configFin, DUR_DEFAULT.Configuracion, [`${pid}-relev`]),
            mk('pruebas', 'Pruebas', pruebasInicio, pruebasFin, DUR_DEFAULT.Pruebas, [`${pid}-config`]),
          ]

          const proyectos = [...state.proyectos, proyecto]
          const asignaciones = [...state.asignaciones, ...nuevas]
          return {
            proyectos,
            asignaciones,
            clienteSeleccionado: pid,
            violaciones: recompute(asignaciones, proyectos, state.personas, state.config),
          }
        })
        return nuevoId
      },

      resetToSeed() {
        set({
          personas: seedPersonas,
          proyectos: seedProyectos,
          asignaciones: seedAsignaciones,
          config: seedConfig,
          violaciones: recompute(seedAsignaciones, seedProyectos, seedPersonas, seedConfig),
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
        personas: state.personas,
        proyectos: state.proyectos,
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
