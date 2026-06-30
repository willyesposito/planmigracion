import type { CSSProperties } from 'react'
import { useSimuladorStore } from '../store'
import { useUIStore } from '../uiStore'

const PRESETS: { label: string; fecha: string }[] = [
  { label: 'Ago 26', fecha: '2026-08-03' },
  { label: 'Oct 26', fecha: '2026-10-05' },
]

export function ConfigPanel() {
  const { config, updateConfigFecha, violaciones, resetToSeed, exportarJSON, importarJSON } = useSimuladorStore()
  const { mostrarCarga, mostrarDep, toggleCarga, toggleDep, setResumen } = useUIStore()

  const transicion = config.fechas_clave.transicion_susana_toyota
  const rojos = violaciones.filter(v => v.severidad === 'rojo').length
  const ambar = violaciones.filter(v => v.severidad === 'ambar').length

  function handleImport() {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try { importarJSON(ev.target?.result as string) } catch { alert('Archivo JSON inválido') }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  function handleExport() {
    const blob = new Blob([exportarJSON()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'plan-migracion.json'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--line)', padding: '9px 18px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      {/* Perilla + presets */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)', whiteSpace: 'nowrap' }}>Transición Susi → Toyota</label>
        <input type="date" value={transicion ?? ''} onChange={e => updateConfigFecha('transicion_susana_toyota', e.target.value || null)}
          style={{ padding: '5px 8px', border: '1.5px solid var(--line)', borderRadius: 8, fontSize: 13, fontWeight: 500, background: 'var(--white)', color: 'var(--ink)' }} />
        {PRESETS.map(p => (
          <button key={p.fecha} onClick={() => updateConfigFecha('transicion_susana_toyota', p.fecha)}
            style={{ ...pillBtn, ...(transicion === p.fecha ? activePill : {}) }} title={`Poner transición en ${p.fecha}`}>{p.label}</button>
        ))}
        {transicion && (
          <button onClick={() => updateConfigFecha('transicion_susana_toyota', null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 16, padding: 0 }} title="Limpiar fecha">×</button>
        )}
      </div>

      {/* Toggles de visualización */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={toggleCarga} style={{ ...pillBtn, ...(mostrarCarga ? activePill : {}) }} title="Pintar carga semanal en las celdas">Carga semanal</button>
        <button onClick={toggleDep} style={{ ...pillBtn, ...(mostrarDep ? activePill : {}) }} title="Mostrar flechas de dependencia de la cuenta seleccionada">Dependencias</button>
      </div>

      {/* Conteos */}
      <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
        {rojos > 0 && <span style={chip('var(--error-bg)', 'var(--error-tx)', 'var(--error-bd)')}>⚠ {rojos} conflicto{rojos !== 1 ? 's' : ''}</span>}
        {ambar > 0 && <span style={chip('var(--warn-bg)', 'var(--warn-tx)', 'var(--warn-bd)')}>⚡ {ambar} aviso{ambar !== 1 ? 's' : ''}</span>}
        {rojos === 0 && ambar === 0 && <span style={chip('var(--ok-bg)', 'var(--ok-tx)', 'var(--ok-bd)')}>✓ Sin conflictos</span>}
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setResumen(true)} style={{ ...actionBtn, background: 'var(--celeste)', color: '#fff', border: 'none' }} title="Resumen ejecutivo imprimible">📄 Resumen</button>
        <button onClick={handleExport} style={actionBtn} title="Exportar plan como JSON">↓ Exportar</button>
        <button onClick={handleImport} style={actionBtn} title="Importar plan desde JSON">↑ Importar</button>
        <button onClick={() => { if (confirm('¿Resetear al plan original del board?')) resetToSeed() }} style={{ ...actionBtn, color: 'var(--error-tx)', borderColor: 'var(--error-bd)' }} title="Volver al seed original">↺ Reset</button>
      </div>
    </div>
  )
}

const pillBtn: CSSProperties = {
  padding: '4px 11px', border: '1.5px solid var(--line)', borderRadius: 9999, background: 'var(--white)',
  cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--t2)',
}
const activePill: CSSProperties = { background: 'var(--celeste)', color: '#fff', borderColor: 'var(--celeste)' }
const actionBtn: CSSProperties = {
  padding: '5px 14px', border: '1.5px solid var(--line)', borderRadius: 9999, background: 'var(--white)',
  cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--t1)',
}
function chip(bg: string, tx: string, bd: string): CSSProperties {
  return { background: bg, color: tx, border: `1px solid ${bd}`, borderRadius: 9999, padding: '4px 12px', fontSize: 12, fontWeight: 700 }
}
