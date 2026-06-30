import { useEffect, useMemo, useRef, useState } from 'react'
import { format, addDays, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { useSimuladorStore } from '../store'
import { useUIStore } from '../uiStore'
import type { Asignacion, TipoFase } from '../types'
import { TIPO_COLOR } from '../theme/fases'
import { getSemanas, semanaIndex, getMondayOfWeek, parseDate, toISO, diasHabiles } from '../utils/dates'

const COL = 32
const ROW_H = 44
const BAR_H = 26
const NAME_W = 140
const HEADER_H = 42

type DragMode = 'phase' | 'account' | 'resize'
interface DragState {
  id: string
  mode: DragMode
  proyectoId: string | null
  startX: number
  origInicio: string
  origFin: string
  origDur: number
  origPersona: string
  dw: number       // semanas desplazadas (preview)
  persona: string  // persona destino (preview)
}

const ROL_LABEL: Record<string, string> = {
  relevamiento: 'RELEV.', configuracion: 'CONFIG.', pruebas: 'PRUEBAS',
}

export function Timeline() {
  const { personas, proyectos, asignaciones, config, violaciones, clienteSeleccionado, updateAsignacion, shiftAccount, seleccionarCliente } =
    useSimuladorStore()
  const { mostrarCarga, mostrarDep } = useUIStore()

  const scrollRef = useRef<HTMLDivElement>(null)
  const rowsRef = useRef<HTMLDivElement>(null)

  const base = useMemo(() => getMondayOfWeek(parseDate(config.horizonte.desde)), [config.horizonte.desde])
  const semanas = useMemo(() => getSemanas(config.horizonte.desde, config.horizonte.hasta), [config.horizonte.desde, config.horizonte.hasta])
  const nWeeks = semanas.length
  const weekIdx = (fecha: string) => semanaIndex(fecha, base)

  const proyectoPorId = useMemo(() => new Map(proyectos.map(p => [p.id, p])), [proyectos])
  const filaDe = useMemo(() => new Map(personas.map((p, i) => [p.id, i])), [personas])

  // ---- conflictos derivados de violaciones (NO recalcula reglas) ----
  const barRojo = useMemo(() => {
    const s = new Set<string>()
    for (const v of violaciones) {
      if (v.severidad === 'rojo' && (v.tipo === 'R1' || v.tipo === 'R3')) s.add(v.asignacion_id)
    }
    return s
  }, [violaciones])

  // carga por persona|semanaISO → severidad (de R2)
  const cargaCelda = useMemo(() => {
    const m = new Map<string, 'rojo' | 'ambar'>()
    for (const v of violaciones) {
      if (v.tipo !== 'R2' || !v.persona_id || !v.semana) continue
      const key = `${v.persona_id}|${v.semana}`
      if (v.severidad === 'rojo' || m.get(key) !== 'rojo') m.set(key, v.severidad)
    }
    return m
  }, [violaciones])

  // ¿la persona está sobrecargada en alguna semana que cubre esta barra? → anillo
  function ringDe(a: Asignacion): 'rojo' | 'ambar' | null {
    const sW = weekIdx(a.inicio), eW = weekIdx(a.fin)
    let worst: 'rojo' | 'ambar' | null = null
    for (let w = sW; w <= eW; w++) {
      const lunesISO = toISO(addDays(base, w * 7))
      const sev = cargaCelda.get(`${a.persona_id}|${lunesISO}`)
      if (sev === 'rojo') return 'rojo'
      if (sev === 'ambar') worst = 'ambar'
    }
    return worst
  }

  // ---- drag ----
  const [drag, setDrag] = useState<DragState | null>(null)
  const dragRef = useRef<DragState | null>(null)
  useEffect(() => { dragRef.current = drag }, [drag])

  useEffect(() => {
    if (!drag) return
    const startX = drag.startX
    function onMove(e: MouseEvent) {
      const dw = Math.round((e.clientX - startX) / COL)
      let persona = dragRef.current?.persona ?? drag!.persona
      if (drag!.mode === 'phase' && rowsRef.current) {
        const rect = rowsRef.current.getBoundingClientRect()
        const idx = Math.max(0, Math.min(personas.length - 1, Math.floor((e.clientY - rect.top) / ROW_H)))
        persona = personas[idx].id
      }
      setDrag(d => (d && d.dw === dw && d.persona === persona) ? d : (d ? { ...d, dw, persona } : d))
    }
    function onUp() {
      const d = dragRef.current
      if (d) commitDrag(d)
      setDrag(null)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    document.body.style.userSelect = 'none'
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      document.body.style.userSelect = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag?.id, personas])

  function commitDrag(d: DragState) {
    if (d.mode === 'account') {
      if (d.dw !== 0 && d.proyectoId) shiftAccount(d.proyectoId, d.dw)
      else seleccionarCliente(d.proyectoId)
      return
    }
    if (d.mode === 'resize') {
      let newFin = toISO(addDays(parseISO(d.origFin), d.dw * 7))
      if (newFin < d.origInicio) newFin = d.origInicio
      const dur = diasHabiles(d.origInicio, newFin)
      if (dur !== d.origDur) updateAsignacion(d.id, { duracion_dias: dur })
      return
    }
    // phase: mover en el tiempo y/o reasignar persona. Sin cambios → click = seleccionar.
    const dwClamped = Math.max(d.dw, -weekIdx(d.origInicio))
    if (dwClamped === 0 && d.persona === d.origPersona) {
      seleccionarCliente(d.proyectoId)
      return
    }
    const inicio = toISO(addDays(parseISO(d.origInicio), dwClamped * 7))
    const patch: Partial<Asignacion> = {}
    if (inicio !== d.origInicio) patch.inicio = inicio
    if (d.persona !== d.origPersona) patch.persona_id = d.persona
    if (Object.keys(patch).length) updateAsignacion(d.id, patch)
  }

  function onBarDown(e: React.MouseEvent, a: Asignacion, mode: DragMode) {
    if (a.es_bloqueo) return
    e.preventDefault()
    if (mode !== 'resize') e.stopPropagation()
    const accountMode = mode !== 'resize' && (e.shiftKey) && !!a.proyecto_id
    setDrag({
      id: a.id,
      mode: accountMode ? 'account' : mode,
      proyectoId: a.proyecto_id,
      startX: e.clientX,
      origInicio: a.inicio,
      origFin: a.fin,
      origDur: a.duracion_dias,
      origPersona: a.persona_id,
      dw: 0,
      persona: a.persona_id,
    })
  }

  // scroll a la cuenta seleccionada
  useEffect(() => {
    if (!clienteSeleccionado || !scrollRef.current) return
    const fases = asignaciones.filter(a => a.proyecto_id === clienteSeleccionado)
    if (!fases.length) return
    const minW = Math.min(...fases.map(a => weekIdx(a.inicio)))
    scrollRef.current.scrollTo({ left: Math.max(0, NAME_W + minW * COL - 120), behavior: 'smooth' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteSeleccionado])

  const transicion = config.fechas_clave.transicion_susana_toyota
  const transicionX = transicion ? NAME_W + weekIdx(transicion) * COL : null

  // ---- geometría de barras (con preview de drag) ----
  function geom(a: Asignacion) {
    let sW = weekIdx(a.inicio)
    let eW = weekIdx(a.fin)
    let row = filaDe.get(a.persona_id) ?? 0
    if (drag) {
      if (drag.mode === 'phase' && drag.id === a.id) {
        const dwc = Math.max(drag.dw, -sW)
        const len = eW - sW
        sW = sW + dwc; eW = sW + len
        row = filaDe.get(drag.persona) ?? row
      } else if (drag.mode === 'resize' && drag.id === a.id) {
        eW = Math.max(sW, weekIdx(toISO(addDays(parseISO(drag.origFin), drag.dw * 7))))
      } else if (drag.mode === 'account' && drag.proyectoId && a.proyecto_id === drag.proyectoId) {
        const dwc = Math.max(drag.dw, -sW)
        sW = sW + dwc; eW = eW + dwc
      }
    }
    const left = NAME_W + sW * COL + 1
    const width = Math.max(COL - 2, (eW - sW + 1) * COL - 2)
    const top = row * ROW_H + (ROW_H - BAR_H) / 2
    return { left, width, top }
  }

  // dependencias (solo cuenta seleccionada)
  const depSegs = useMemo(() => {
    if (!mostrarDep || !clienteSeleccionado) return []
    const segs: { x1: number; y1: number; x2: number; y2: number; viola: boolean }[] = []
    const fases = asignaciones.filter(a => a.proyecto_id === clienteSeleccionado)
    const byId = new Map(asignaciones.map(a => [a.id, a]))
    for (const a of fases) {
      const rowA = filaDe.get(a.persona_id) ?? 0
      for (const predId of a.predecesoras) {
        const pred = byId.get(predId)
        if (!pred) continue
        const rowP = filaDe.get(pred.persona_id) ?? 0
        const x1 = NAME_W + (weekIdx(pred.fin) + 1) * COL
        const y1 = rowP * ROW_H + ROW_H / 2
        const x2 = NAME_W + weekIdx(a.inicio) * COL + 1
        const y2 = rowA * ROW_H + ROW_H / 2
        segs.push({ x1, y1, x2, y2, viola: a.inicio < pred.fin })
      }
    }
    return segs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarDep, clienteSeleccionado, asignaciones, personas])

  const bodyW = NAME_W + nWeeks * COL
  const bodyH = personas.length * ROW_H

  return (
    <div ref={scrollRef} style={{ overflow: 'auto', height: '100%', background: 'var(--white)' }}>
      <div style={{ position: 'relative', width: bodyW }}>

        {/* HEADER */}
        <div style={{ position: 'sticky', top: 0, zIndex: 30, display: 'flex', height: HEADER_H, background: 'var(--white)', borderBottom: '2px solid var(--line)' }}>
          <div style={{ position: 'sticky', left: 0, zIndex: 31, width: NAME_W, flexShrink: 0, display: 'flex', alignItems: 'center', paddingLeft: 12, fontSize: 12, fontWeight: 700, color: 'var(--t2)', background: 'var(--paper)', borderRight: '2px solid var(--line)' }}>
            Persona
          </div>
          {semanas.map((s, i) => {
            const isMonth = s.getDate() <= 7
            const mes = isMonth ? format(s, 'MMM', { locale: es }).toUpperCase() : ''
            const hoy = s <= new Date() && addDays(s, 6) >= new Date()
            return (
              <div key={i} title={format(s, 'd MMM yyyy', { locale: es })}
                style={{ width: COL, flexShrink: 0, borderRight: '1px solid var(--line-soft)', background: hoy ? 'var(--celeste-dim)' : isMonth ? 'var(--paper)' : 'var(--white)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: isMonth ? 'var(--t2)' : 'var(--t3)', fontWeight: isMonth ? 700 : 400, userSelect: 'none' }}>
                {mes && <span>{mes}</span>}
                <span style={{ fontSize: 8, color: 'var(--t3)' }}>{format(s, 'd')}</span>
              </div>
            )
          })}
        </div>

        {/* BODY */}
        <div ref={rowsRef} style={{ position: 'relative', height: bodyH }}>

          {/* zebra */}
          {personas.map((p, i) => (
            <div key={p.id} style={{ position: 'absolute', top: i * ROW_H, left: 0, width: bodyW, height: ROW_H, background: i % 2 ? 'var(--paper)' : 'var(--white)', borderBottom: '1px solid var(--line-soft)' }} />
          ))}

          {/* tintes de carga (R2) */}
          {mostrarCarga && [...cargaCelda.entries()].map(([key, sev]) => {
            const [pid, semISO] = key.split('|')
            const row = filaDe.get(pid)
            if (row == null) return null
            const w = semanaIndex(semISO, base)
            if (w < 0 || w >= nWeeks) return null
            return (
              <div key={key} style={{ position: 'absolute', top: row * ROW_H, left: NAME_W + w * COL, width: COL, height: ROW_H, background: sev === 'rojo' ? 'rgba(232,85,24,0.15)' : 'rgba(245,158,11,0.16)', zIndex: 1, pointerEvents: 'none' }} />
            )
          })}

          {/* línea de transición Susi → Toyota */}
          {transicionX !== null && (
            <div style={{ position: 'absolute', top: 0, left: transicionX, height: bodyH, borderLeft: '2px dashed var(--error)', zIndex: 4, pointerEvents: 'none' }}>
              <span style={{ position: 'absolute', top: 2, left: 4, fontSize: 9, fontWeight: 700, color: '#fff', background: 'var(--error)', padding: '1px 6px', borderRadius: 9999, whiteSpace: 'nowrap' }}>
                Susi → Toyota
              </span>
            </div>
          )}

          {/* dependencias */}
          {depSegs.length > 0 && (
            <svg style={{ position: 'absolute', top: 0, left: 0, width: bodyW, height: bodyH, zIndex: 6, pointerEvents: 'none', overflow: 'visible' }}>
              <defs>
                <marker id="haArrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="var(--t3)" />
                </marker>
                <marker id="haArrowRed" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="var(--error)" />
                </marker>
              </defs>
              {depSegs.map((s, i) => (
                <path key={i}
                  d={`M ${s.x1} ${s.y1} C ${s.x1 + 26} ${s.y1}, ${s.x2 - 26} ${s.y2}, ${s.x2} ${s.y2}`}
                  fill="none"
                  stroke={s.viola ? 'var(--error)' : 'var(--celeste)'}
                  strokeWidth={s.viola ? 2 : 1.4}
                  strokeDasharray={s.viola ? undefined : '5 4'}
                  markerEnd={`url(#${s.viola ? 'haArrowRed' : 'haArrow'})`}
                />
              ))}
            </svg>
          )}

          {/* columna de nombres (sticky-left) */}
          <div style={{ position: 'sticky', left: 0, top: 0, width: NAME_W, height: bodyH, zIndex: 20, pointerEvents: 'none' }}>
            {personas.map((p, i) => (
              <div key={p.id} style={{ position: 'absolute', top: i * ROW_H, left: 0, width: NAME_W, height: ROW_H, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: 12, background: i % 2 ? 'var(--paper)' : 'var(--white)', borderRight: '2px solid var(--line)', borderBottom: '1px solid var(--line-soft)' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', lineHeight: 1.1 }}>{p.alias}</span>
                {p.rol && <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--t3)' }}>{ROL_LABEL[p.rol]}</span>}
              </div>
            ))}
          </div>

          {/* barras */}
          {asignaciones.map(a => {
            const colStart = weekIdx(a.inicio), colEnd = weekIdx(a.fin)
            if (colEnd < 0 || colStart > nWeeks) return null
            const { left, width, top } = geom(a)
            const proyecto = a.proyecto_id ? proyectoPorId.get(a.proyecto_id) : null
            const esRojo = barRojo.has(a.id)
            const fill = esRojo ? 'var(--error)' : TIPO_COLOR[a.tipo as TipoFase]
            const ring = a.es_bloqueo ? null : ringDe(a)
            const seleccionada = !!clienteSeleccionado && a.proyecto_id === clienteSeleccionado
            const atenuada = !!clienteSeleccionado && a.proyecto_id !== clienteSeleccionado
            const boxShadow = ring === 'rojo' ? '0 0 0 2px var(--error)' : ring === 'ambar' ? '0 0 0 2px var(--warn)' : seleccionada ? '0 0 0 2px var(--celeste)' : 'none'
            const label = a.es_bloqueo ? (a._nombre ?? a.tipo) : `${proyecto?.nombre ?? ''} · ${a.tipo}`
            const arrastrando = drag?.id === a.id
            const tipoCorto = a.tipo === 'Relevamiento' ? 'Relev.' : a.tipo === 'Configuracion' ? 'Config.' : a.tipo

            return (
              <div key={a.id}
                onMouseDown={e => onBarDown(e, a, 'phase')}
                title={`${label}\n${a.inicio} → ${a.fin} · ${a.duracion_dias} días hábiles${a.es_bloqueo ? '' : '\nArrastrá para mover · Shift = cuenta entera · borde derecho = estirar'}`}
                style={{
                  position: 'absolute', left, top, width, height: BAR_H,
                  background: fill, borderRadius: 6, display: 'flex', alignItems: 'center', paddingLeft: 7, paddingRight: 6,
                  overflow: 'hidden', fontSize: 10, color: '#fff', fontWeight: 600, whiteSpace: 'nowrap',
                  boxShadow, cursor: a.es_bloqueo ? 'default' : 'grab',
                  opacity: a.es_bloqueo ? (atenuada ? 0.25 : 0.55) : (atenuada ? 0.38 : 1),
                  zIndex: arrastrando ? 15 : 10,
                  transition: arrastrando ? 'none' : 'left var(--t-fast) var(--ease), top var(--t-fast) var(--ease), width var(--t-fast) var(--ease), box-shadow var(--t-fast) var(--ease), opacity var(--t-fast) var(--ease)',
                  userSelect: 'none',
                }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {proyecto ? `${proyecto.nombre} · ${tipoCorto}` : label}
                </span>
                {/* grip de resize */}
                {!a.es_bloqueo && (
                  <div onMouseDown={e => onBarDown(e, a, 'resize')}
                    style={{ position: 'absolute', right: 0, top: 0, width: 8, height: '100%', cursor: 'ew-resize', background: 'rgba(255,255,255,0.18)', borderRadius: '0 6px 6px 0' }} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
