import { useMemo, type CSSProperties } from 'react'
import { useSimuladorStore } from '../store'
import { useUIStore } from '../uiStore'
import { formatFechaCorta } from '../utils/dates'

export function AccountRail() {
  const { proyectos, asignaciones, violaciones, clienteSeleccionado, seleccionarCliente } = useSimuladorStore()
  const abrirModal = useUIStore(s => s.abrirModal)

  // violaciones por asignación → color por cuenta
  const colorPorProyecto = useMemo(() => {
    const sevPorAsig = new Map<string, 'rojo' | 'ambar'>()
    for (const v of violaciones) {
      const prev = sevPorAsig.get(v.asignacion_id)
      if (v.severidad === 'rojo' || prev !== 'rojo') sevPorAsig.set(v.asignacion_id, v.severidad)
    }
    const m = new Map<string, 'verde' | 'ambar' | 'rojo'>()
    for (const p of proyectos) {
      const sevs = asignaciones.filter(a => a.proyecto_id === p.id).map(a => sevPorAsig.get(a.id))
      m.set(p.id, sevs.includes('rojo') ? 'rojo' : sevs.includes('ambar') ? 'ambar' : 'verde')
    }
    return m
  }, [proyectos, asignaciones, violaciones])

  const cuentas = useMemo(() => {
    return proyectos
      .map(p => {
        const fases = asignaciones.filter(a => a.proyecto_id === p.id && !a.es_bloqueo)
        const primeraFase = fases.reduce<string | null>((min, a) => (!min || a.inicio < min ? a.inicio : min), null)
        return { proyecto: p, primeraFase }
      })
      .sort((a, b) => {
        if (!a.primeraFase && !b.primeraFase) return 0
        if (!a.primeraFase) return 1
        if (!b.primeraFase) return -1
        return a.primeraFase < b.primeraFase ? -1 : 1
      })
  }, [proyectos, asignaciones])

  return (
    <div style={{ width: 218, flexShrink: 0, borderRight: '1px solid var(--line)', background: 'var(--paper)', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Cabecera con acciones */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--line)', background: 'var(--white)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--t2)' }}>{cuentas.length} cuentas</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => abrirModal('equipo')} style={railBtn} title="Gestionar equipo">👥 Equipo</button>
          <button onClick={() => abrirModal('cuenta')} style={{ ...railBtn, background: 'var(--celeste)', color: '#fff', border: 'none' }} title="Agregar cuenta">+ Cuenta</button>
        </div>
      </div>

      {/* Lista */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {cuentas.map(({ proyecto, primeraFase }) => {
          const color = colorPorProyecto.get(proyecto.id) ?? 'verde'
          const activo = proyecto.id === clienteSeleccionado
          return (
            <button
              key={proyecto.id}
              onClick={() => seleccionarCliente(proyecto.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 12px',
                border: 'none', background: activo ? 'var(--celeste-dim)' : 'transparent', cursor: 'pointer',
                textAlign: 'left', borderLeft: activo ? '3px solid var(--celeste)' : '3px solid transparent',
                transition: 'background 0.12s',
              }}
            >
              <span style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
                background: color === 'verde' ? 'var(--ok)' : color === 'ambar' ? 'var(--warn)' : 'var(--error)' }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13.5, fontWeight: activo ? 700 : 500, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {proyecto.nombre}
                </span>
                <span style={{ fontSize: 10.5, color: 'var(--t3)' }}>
                  {primeraFase ? `desde ${formatFechaCorta(primeraFase)}` : 'sin planificar'}
                </span>
              </span>
              <span style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                {proyecto.especial && <span style={badge('var(--tasa)')}>TASA</span>}
                {proyecto.quick_win && <span style={badge('var(--ok)')}>QW</span>}
                {proyecto.entidades > 1 && <span style={badge('var(--celeste)')}>×{proyecto.entidades}</span>}
              </span>
            </button>
          )
        })}
      </div>

      {/* Nota de privacidad (regla dura) */}
      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--line)', fontSize: 9.5, color: 'var(--t3)', lineHeight: 1.4 }}>
        Solo alias y nombres comerciales. Sin datos personales.
      </div>
    </div>
  )
}

const railBtn: CSSProperties = {
  flex: 1, padding: '6px 8px', border: '1.5px solid var(--line)', borderRadius: 9999,
  background: 'var(--white)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--t1)',
}

function badge(bg: string): CSSProperties {
  return { fontSize: 9.5, background: bg, color: '#fff', borderRadius: 4, padding: '1px 5px', fontWeight: 600 }
}
