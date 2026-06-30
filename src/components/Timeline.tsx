import { useMemo, type CSSProperties } from 'react'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { useSimuladorStore } from '../store'
import type { TipoFase } from '../types'
import { TIPO_COLOR } from '../theme/fases'
import { getSemanas, semanaIndex, getMondayOfWeek, parseDate } from '../utils/dates'

const COL_WIDTH = 30
const ROW_HEIGHT = 36
const NAME_WIDTH = 110

export function Timeline() {
  const { personas, proyectos, asignaciones, config, violaciones } = useSimuladorStore()

  const desde = getMondayOfWeek(parseDate(config.horizonte.desde))
  const semanas = useMemo(() => getSemanas(config.horizonte.desde, config.horizonte.hasta), [config])
  const totalSemanas = semanas.length

  const proyectoPorId = useMemo(() => new Map(proyectos.map(p => [p.id, p])), [proyectos])

  const violacionesPorAsig = useMemo(() => {
    const m = new Map<string, typeof violaciones>()
    for (const v of violaciones) {
      m.set(v.asignacion_id, [...(m.get(v.asignacion_id) ?? []), v])
    }
    return m
  }, [violaciones])

  function getBarColor(asigId: string, tipo: TipoFase) {
    const viols = violacionesPorAsig.get(asigId) ?? []
    if (viols.some(v => v.severidad === 'rojo')) return 'var(--error)'
    if (viols.some(v => v.severidad === 'ambar')) return 'var(--warn)'
    return TIPO_COLOR[tipo]
  }

  function getColStart(fecha: string) {
    return semanaIndex(fecha, desde) + 1
  }
  function getColEnd(fecha: string) {
    const endLunes = getMondayOfWeek(parseDate(fecha))
    const idx = Math.floor((endLunes.getTime() - desde.getTime()) / (7 * 24 * 3600 * 1000))
    return idx + 2
  }

  const transicion = config.fechas_clave.transicion_susana_toyota
  const transicionCol = transicion
    ? semanaIndex(transicion, desde) + 1
    : null

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `${NAME_WIDTH}px repeat(${totalSemanas}, ${COL_WIDTH}px)`,
    gridAutoRows: `${ROW_HEIGHT}px`,
    position: 'relative',
  }

  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', height: '100%', background: 'var(--white)' }}>
      <div style={{ minWidth: NAME_WIDTH + totalSemanas * COL_WIDTH }}>

        {/* Header de semanas */}
        <div style={{ ...gridStyle, position: 'sticky', top: 0, zIndex: 10, background: 'var(--white)', borderBottom: '2px solid var(--line)' }}>
          <div style={{ background: 'var(--paper)', borderRight: '2px solid var(--line)', display: 'flex', alignItems: 'center', paddingLeft: 8, fontSize: 12, fontWeight: 700, color: 'var(--t2)' }}>
            Persona
          </div>
          {semanas.map((s, i) => {
            const isMonth = s.getDate() <= 7
            const mesLabel = isMonth ? format(s, 'MMM', { locale: es }).toUpperCase() : ''
            const esHoy = s <= new Date() && addDays(s, 6) >= new Date()
            return (
              <div
                key={i}
                style={{
                  borderRight: '1px solid var(--line-soft)',
                  background: esHoy ? 'var(--celeste-dim)' : isMonth ? 'var(--paper)' : 'var(--white)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  color: isMonth ? 'var(--t2)' : 'var(--t3)',
                  fontWeight: isMonth ? 700 : 400,
                  overflow: 'hidden',
                  cursor: 'default',
                  userSelect: 'none',
                }}
                title={format(s, 'd MMM yyyy', { locale: es })}
              >
                {mesLabel && <span>{mesLabel}</span>}
                <span style={{ color: 'var(--t3)', fontSize: 8 }}>{format(s, 'd')}</span>
              </div>
            )
          })}
        </div>

        {/* Filas por persona */}
        {personas.map((persona, rowIdx) => {
          const fasesPersona = asignaciones.filter(a => a.persona_id === persona.id)
          return (
            <div key={persona.id} style={{ ...gridStyle, background: rowIdx % 2 === 0 ? 'var(--white)' : 'var(--paper)', borderBottom: '1px solid var(--line-soft)' }}>
              {/* Nombre */}
              <div
                style={{
                  gridColumn: 1,
                  gridRow: 1,
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--t1)',
                  background: 'inherit',
                  borderRight: '2px solid var(--line)',
                  position: 'sticky',
                  left: 0,
                  zIndex: 2,
                }}
              >
                {persona.alias}
              </div>

              {/* Celdas de semanas (background) */}
              {semanas.map((_s, i) => (
                <div
                  key={i}
                  style={{
                    gridColumn: i + 2,
                    gridRow: 1,
                    borderRight: '1px solid var(--line-soft)',
                    background: 'transparent',
                  }}
                />
              ))}

              {/* Barras de fases */}
              {fasesPersona.map(a => {
                const colStart = getColStart(a.inicio)
                const colEnd = getColEnd(a.fin)
                if (colEnd <= 1 || colStart > totalSemanas + 1) return null
                const proyecto = a.proyecto_id ? proyectoPorId.get(a.proyecto_id) : null
                const barColor = getBarColor(a.id, a.tipo)
                const label = a.es_bloqueo
                  ? (a._nombre ?? a.tipo)
                  : `${proyecto?.nombre ?? ''} ${a.tipo}`

                return (
                  <div
                    key={a.id}
                    title={`${label}\n${a.inicio} → ${a.fin}\n${a.duracion_dias} días`}
                    style={{
                      gridColumn: `${Math.max(1, colStart) + 1} / ${Math.min(colEnd + 1, totalSemanas + 2)}`,
                      gridRow: 1,
                      alignSelf: 'center',
                      height: 24,
                      background: barColor,
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: 6,
                      overflow: 'hidden',
                      fontSize: 10,
                      color: '#fff',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      zIndex: 1,
                      opacity: a.es_bloqueo ? 0.5 : 1,
                      cursor: 'default',
                    }}
                  >
                    {label}
                  </div>
                )
              })}

              {/* Línea de transición Susi */}
              {persona.id === 'susi' && transicionCol !== null && (
                <div
                  style={{
                    gridColumn: `${transicionCol + 1}`,
                    gridRow: 1,
                    alignSelf: 'stretch',
                    borderLeft: '2px dashed var(--error)',
                    zIndex: 3,
                    pointerEvents: 'none',
                  }}
                  title={`Transición Susi → Toyota: ${transicion}`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
