import { useState, type CSSProperties } from 'react'
import { addWeeks } from 'date-fns'
import { useSimuladorStore } from '../store'
import { useUIStore } from '../uiStore'
import { Overlay } from './ModalEquipo'
import { getMondayOfWeek, toISO } from '../utils/dates'

function inicioPorDefecto(): string {
  return toISO(getMondayOfWeek(addWeeks(new Date(), 1)))
}

export function ModalAgregarCuenta() {
  const addProyecto = useSimuladorStore(s => s.addProyecto)
  const cerrarModal = useUIStore(s => s.cerrarModal)
  const [nombre, setNombre] = useState('')
  const [inicio, setInicio] = useState(inicioPorDefecto)

  function handleAdd() {
    const n = nombre.trim()
    if (!n) return
    addProyecto(n, inicio)
    cerrarModal()
  }

  return (
    <Overlay titulo="Agregar cuenta" onClose={cerrarModal}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={lbl}>Nombre comercial</label>
          <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. Nueva Cuenta SA" onKeyDown={e => e.key === 'Enter' && handleAdd()} style={inp} maxLength={40} autoFocus />
        </div>
        <div>
          <label style={lbl}>Inicio del relevamiento</label>
          <input type="date" value={inicio} onChange={e => e.target.value && setInicio(e.target.value)} style={inp} />
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: 0, lineHeight: 1.5 }}>
          Se crean 3 fases encadenadas (Relevamiento → Configuración → Pruebas) autoasignadas por rol/skill. La complejidad queda <strong>sin definir</strong>: la completás a mano.
        </p>
        <button onClick={handleAdd} disabled={!nombre.trim()} style={{ ...addBtn, opacity: nombre.trim() ? 1 : 0.5 }}>+ Crear cuenta</button>
      </div>
    </Overlay>
  )
}

const lbl: CSSProperties = { display: 'block', fontSize: 10.5, fontWeight: 700, color: 'var(--t2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }
const inp: CSSProperties = { width: '100%', padding: '8px 11px', border: '1.5px solid var(--line)', borderRadius: 8, fontSize: 14, background: 'var(--white)', color: 'var(--ink)' }
const addBtn: CSSProperties = { padding: '9px', border: 'none', borderRadius: 9999, background: 'var(--celeste)', color: '#fff', cursor: 'pointer', fontSize: 13.5, fontWeight: 700 }
