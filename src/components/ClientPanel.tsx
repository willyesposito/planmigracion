import type { CSSProperties } from 'react'
import { useSimuladorStore } from '../store'
import type { Asignacion, Persona, TipoFase, Violacion } from '../types'
import { TIPO_COLOR, TIPO_LABEL, ORDEN_FASES } from '../theme/fases'
import { formatFechaCorta } from '../utils/dates'

export function ClientPanel() {
  const { proyectos, asignaciones, personas, violaciones, clienteSeleccionado, seleccionarCliente, updateAsignacion } =
    useSimuladorStore()

  const clienteProyectos = proyectos
    .map(p => {
      const fases = asignaciones.filter(a => a.proyecto_id === p.id && !a.es_bloqueo)
      const primeraFase = fases.reduce<string | null>((min, a) => (!min || a.inicio < min ? a.inicio : min), null)
      return { proyecto: p, fases, primeraFase }
    })
    .sort((a, b) => {
      if (!a.primeraFase && !b.primeraFase) return 0
      if (!a.primeraFase) return 1
      if (!b.primeraFase) return -1
      return a.primeraFase < b.primeraFase ? -1 : 1
    })

  const violacionesPorAsignacion = new Map<string, typeof violaciones>()
  for (const v of violaciones) {
    const list = violacionesPorAsignacion.get(v.asignacion_id) ?? []
    violacionesPorAsignacion.set(v.asignacion_id, [...list, v])
  }

  function colorDeCliente(proyectoId: string): 'verde' | 'ambar' | 'rojo' {
    const ids = asignaciones.filter(a => a.proyecto_id === proyectoId).map(a => a.id)
    const viols = violaciones.filter(v => ids.includes(v.asignacion_id))
    if (viols.some(v => v.severidad === 'rojo')) return 'rojo'
    if (viols.some(v => v.severidad === 'ambar')) return 'ambar'
    return 'verde'
  }

  const seleccionado = clienteProyectos.find(c => c.proyecto.id === clienteSeleccionado)
  const fasesPorTipo = seleccionado
    ? ORDEN_FASES.map(tipo => ({
        tipo,
        asignacion: seleccionado.fases.find(f => f.tipo === tipo) ?? null,
      }))
    : []

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Lista de clientes */}
      <div
        style={{
          width: 240,
          borderRight: '1px solid var(--line)',
          overflowY: 'auto',
          flexShrink: 0,
          background: 'var(--paper)',
        }}
      >
        <div style={{ padding: '12px 16px', fontWeight: 700, fontSize: 13, color: 'var(--t2)', borderBottom: '1px solid var(--line)', background: 'var(--white)' }}>
          {clienteProyectos.length} clientes
        </div>
        {clienteProyectos.map(({ proyecto, primeraFase }) => {
          const color = colorDeCliente(proyecto.id)
          const activo = proyecto.id === clienteSeleccionado
          return (
            <button
              key={proyecto.id}
              onClick={() => seleccionarCliente(proyecto.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 16px',
                border: 'none',
                background: activo ? 'var(--celeste-dim)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                borderLeft: activo ? '3px solid var(--celeste)' : '3px solid transparent',
                transition: 'background 0.1s',
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: color === 'verde' ? 'var(--ok)' : color === 'ambar' ? 'var(--warn)' : 'var(--error)',
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: activo ? 600 : 400, color: 'var(--ink)' }}>
                  {proyecto.nombre}
                </span>
                {primeraFase && (
                  <span style={{ fontSize: 11, color: 'var(--t3)' }}>
                    desde {formatFechaCorta(primeraFase)}
                  </span>
                )}
              </span>
              <span style={{ display: 'flex', gap: 3 }}>
                {proyecto.especial && (
                  <span style={{ fontSize: 10, background: 'var(--tasa)', color: '#fff', borderRadius: 4, padding: '1px 5px' }}>
                    TASA
                  </span>
                )}
                {proyecto.quick_win && (
                  <span style={{ fontSize: 10, background: 'var(--ok)', color: '#fff', borderRadius: 4, padding: '1px 5px' }}>
                    QW
                  </span>
                )}
                {proyecto.entidades > 1 && (
                  <span style={{ fontSize: 10, background: 'var(--celeste)', color: '#fff', borderRadius: 4, padding: '1px 5px' }}>
                    ×{proyecto.entidades}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      {/* Panel de detalle */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: 'var(--paper)' }}>
        {!seleccionado ? (
          <div style={{ color: 'var(--t3)', textAlign: 'center', marginTop: 80, fontSize: 15 }}>
            Seleccioná un cliente para ver y editar sus fases
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>{seleccionado.proyecto.nombre}</h2>
              {seleccionado.proyecto.especial && (
                <span style={{ background: 'var(--tasa)', color: '#fff', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                  Especial (Toyota)
                </span>
              )}
              {seleccionado.proyecto.quick_win && (
                <span style={{ background: 'var(--ok)', color: '#fff', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                  Quick-win
                </span>
              )}
              {seleccionado.proyecto.entidades > 1 && (
                <span style={{ background: 'var(--celeste)', color: '#fff', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                  {seleccionado.proyecto.entidades} entidades
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {fasesPorTipo.map(({ tipo, asignacion }) => (
                <FaseCard
                  key={tipo}
                  tipo={tipo}
                  asignacion={asignacion}
                  personas={personas}
                  violaciones={asignacion ? (violacionesPorAsignacion.get(asignacion.id) ?? []) : []}
                  onUpdate={(patch) => asignacion && updateAsignacion(asignacion.id, patch)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

interface FaseCardProps {
  tipo: TipoFase
  asignacion: Asignacion | null
  personas: Persona[]
  violaciones: Violacion[]
  onUpdate: (patch: Partial<Asignacion>) => void
}

function FaseCard({ tipo, asignacion, personas, violaciones, onUpdate }: FaseCardProps) {
  const color = TIPO_COLOR[tipo]
  const hasRojo = violaciones.some(v => v.severidad === 'rojo')
  const hasAmbar = violaciones.some(v => v.severidad === 'ambar')
  const borderColor = hasRojo ? 'var(--error)' : hasAmbar ? 'var(--warn)' : 'var(--line)'

  return (
    <div
      style={{
        border: `1.5px solid ${borderColor}`,
        borderRadius: 10,
        overflow: 'hidden',
        background: 'var(--white)',
        boxShadow: 'var(--sh-sm)',
      }}
    >
      {/* Header de la fase */}
      <div style={{ background: color, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{TIPO_LABEL[tipo]}</span>
        {(hasRojo || hasAmbar) && (
          <span
            style={{
              background: hasRojo ? 'var(--error)' : 'var(--warn)',
              color: '#fff',
              borderRadius: 12,
              padding: '2px 8px',
              fontSize: 11,
              fontWeight: 600,
              marginLeft: 'auto',
            }}
          >
            {hasRojo ? '⚠ Conflicto' : '⚡ Atención'}
          </span>
        )}
      </div>

      {asignacion ? (
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {/* Persona */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--t2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Asignado a
              </label>
              <select
                value={asignacion.persona_id}
                onChange={e => onUpdate({ persona_id: e.target.value })}
                style={{
                  padding: '7px 10px',
                  border: '1.5px solid var(--line)',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  background: 'var(--white)',
                  color: 'var(--ink)',
                  cursor: 'pointer',
                  minWidth: 150,
                }}
              >
                {personas.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.alias}
                  </option>
                ))}
              </select>
            </div>

            {/* Duración */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--t2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Duración
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => onUpdate({ duracion_dias: Math.max(1, asignacion.duracion_dias - 1) })}
                  style={btnStyle}
                  title="Restar 1 día hábil"
                >
                  −
                </button>
                <span style={{ minWidth: 70, textAlign: 'center', fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
                  {asignacion.duracion_dias} días
                </span>
                <button
                  onClick={() => onUpdate({ duracion_dias: asignacion.duracion_dias + 1 })}
                  style={btnStyle}
                  title="Sumar 1 día hábil"
                >
                  +
                </button>
              </div>
            </div>

            {/* Fecha inicio */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--t2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Inicio
              </label>
              <input
                type="date"
                value={asignacion.inicio}
                onChange={e => e.target.value && onUpdate({ inicio: e.target.value })}
                style={{
                  padding: '7px 10px',
                  border: '1.5px solid var(--line)',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  background: 'var(--white)',
                  color: 'var(--ink)',
                  cursor: 'pointer',
                }}
              />
            </div>

            {/* Fecha fin (calculada) */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--t2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Fin (calculado)
              </label>
              <div
                style={{
                  padding: '7px 12px',
                  background: 'var(--paper)',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--t2)',
                  border: '1.5px solid var(--line-soft)',
                }}
              >
                {formatFechaCorta(asignacion.fin)} {asignacion.fin.slice(0, 4)}
              </div>
            </div>
          </div>

          {/* Violaciones */}
          {violaciones.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {violaciones.map((v, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 12,
                    padding: '6px 10px',
                    background: v.severidad === 'rojo' ? 'var(--error-bg)' : 'var(--warn-bg)',
                    borderLeft: `3px solid ${v.severidad === 'rojo' ? 'var(--error)' : 'var(--warn)'}`,
                    borderRadius: '0 6px 6px 0',
                    color: v.severidad === 'rojo' ? 'var(--error-tx)' : 'var(--warn-tx)',
                  }}
                >
                  {v.mensaje}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: '16px', color: 'var(--t3)', fontSize: 13, fontStyle: 'italic' }}>
          Sin planificar
        </div>
      )}
    </div>
  )
}

const btnStyle: CSSProperties = {
  width: 30,
  height: 30,
  border: '1.5px solid var(--line)',
  borderRadius: 9999,
  background: 'var(--white)',
  cursor: 'pointer',
  fontSize: 18,
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 600,
  color: 'var(--t1)',
}
