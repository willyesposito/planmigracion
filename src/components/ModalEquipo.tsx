import { useState, type CSSProperties } from 'react'
import { useSimuladorStore } from '../store'
import { useUIStore } from '../uiStore'
import type { RolPersona } from '../types'

const ROLES: { value: RolPersona | ''; label: string }[] = [
  { value: '', label: 'Sin clasificar' },
  { value: 'relevamiento', label: 'Relev.' },
  { value: 'configuracion', label: 'Config.' },
  { value: 'pruebas', label: 'Pruebas' },
]
const ROL_LABEL: Record<string, string> = { relevamiento: 'Relevamiento', configuracion: 'Configuración', pruebas: 'Pruebas' }

export function ModalEquipo() {
  const { personas, asignaciones, addPersona, removePersona } = useSimuladorStore()
  const cerrarModal = useUIStore(s => s.cerrarModal)
  const [alias, setAlias] = useState('')
  const [rol, setRol] = useState<RolPersona | ''>('')
  const [error, setError] = useState<string | null>(null)

  function handleAdd() {
    const a = alias.trim()
    if (!a) return
    addPersona(a, rol || null)
    setAlias(''); setRol(''); setError(null)
  }

  function handleRemove(id: string) {
    const r = removePersona(id)
    if (!r.ok) setError(r.motivo ?? 'No se puede quitar.')
    else setError(null)
  }

  const usoPorPersona = (id: string) => asignaciones.filter(a => a.persona_id === id).length

  return (
    <Overlay onClose={cerrarModal} titulo="Equipo">
      {/* Alta */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 14, borderBottom: '1px solid var(--line)' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t2)' }}>Agregar recurso</span>
        <input value={alias} onChange={e => setAlias(e.target.value)} placeholder="Alias (sin nombres reales)" onKeyDown={e => e.key === 'Enter' && handleAdd()}
          style={inp} maxLength={24} />
        <div style={{ display: 'flex', gap: 6 }}>
          {ROLES.map(r => (
            <button key={r.value} onClick={() => setRol(r.value as RolPersona | '')}
              style={{ ...seg, ...(rol === r.value ? segActive : {}) }}>{r.label}</button>
          ))}
        </div>
        <button onClick={handleAdd} disabled={!alias.trim()} style={{ ...addBtn, opacity: alias.trim() ? 1 : 0.5 }}>+ Agregar al equipo</button>
        <span style={{ fontSize: 10.5, color: 'var(--t3)' }}>Solo alias y rol. Nunca nombres reales, CUIT/CUIL, sueldos ni legajos.</span>
      </div>

      {error && <div style={{ margin: '12px 0', fontSize: 12, padding: '8px 10px', background: 'var(--error-bg)', color: 'var(--error-tx)', borderRadius: 8, borderLeft: '3px solid var(--error)' }}>{error}</div>}

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12, maxHeight: 320, overflowY: 'auto' }}>
        {personas.map(p => {
          const uso = usoPorPersona(p.id)
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--white)' }}>
              <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--ink)', flex: 1 }}>{p.alias}</span>
              <span style={{ fontSize: 10.5, color: p.rol ? 'var(--celeste-dark)' : 'var(--t3)', fontWeight: 600 }}>{p.rol ? ROL_LABEL[p.rol] : 'sin clasificar'}</span>
              <span style={{ fontSize: 10.5, color: 'var(--t3)' }}>{uso} fase{uso !== 1 ? 's' : ''}</span>
              <button onClick={() => handleRemove(p.id)} title={uso ? 'Tiene fases asignadas' : 'Quitar'}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: uso ? 'var(--t3)' : 'var(--error)', fontSize: 16, opacity: uso ? 0.4 : 1 }}>×</button>
            </div>
          )
        })}
      </div>
    </Overlay>
  )
}

// ---------- shell reutilizable ----------
export function Overlay({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(10,19,30,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 420, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'var(--white)', borderRadius: 16, boxShadow: 'var(--sh)', padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ink)', flex: 1 }}>{titulo}</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const inp: CSSProperties = { padding: '8px 11px', border: '1.5px solid var(--line)', borderRadius: 8, fontSize: 14, background: 'var(--white)', color: 'var(--ink)' }
const seg: CSSProperties = { flex: 1, padding: '6px 4px', border: '1.5px solid var(--line)', borderRadius: 8, background: 'var(--white)', cursor: 'pointer', fontSize: 11.5, fontWeight: 600, color: 'var(--t2)' }
const segActive: CSSProperties = { background: 'var(--celeste)', color: '#fff', borderColor: 'var(--celeste)' }
const addBtn: CSSProperties = { padding: '8px', border: 'none', borderRadius: 9999, background: 'var(--celeste)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }
