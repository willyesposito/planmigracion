import type { CSSProperties } from 'react'
import { useSimuladorStore } from '../store'

export function ConfigPanel() {
  const { config, updateConfigFecha, violaciones, resetToSeed, exportarJSON, importarJSON } = useSimuladorStore()

  const rojos = violaciones.filter(v => v.severidad === 'rojo').length
  const ambar = violaciones.filter(v => v.severidad === 'ambar').length

  function handleImport() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          importarJSON(ev.target?.result as string)
        } catch {
          alert('Archivo JSON inválido')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  function handleExport() {
    const json = exportarJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'plan-migracion.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--line)', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      {/* Perilla principal */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)', whiteSpace: 'nowrap' }}>
          Transición Susi → Toyota
        </label>
        <input
          type="date"
          value={config.fechas_clave.transicion_susana_toyota ?? ''}
          onChange={e => updateConfigFecha('transicion_susana_toyota', e.target.value || null)}
          style={{
            padding: '5px 8px',
            border: '1.5px solid var(--line)',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            background: 'var(--white)',
            color: 'var(--ink)',
          }}
        />
        {config.fechas_clave.transicion_susana_toyota && (
          <button
            onClick={() => updateConfigFecha('transicion_susana_toyota', null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 16, padding: 0 }}
            title="Limpiar fecha"
          >
            ×
          </button>
        )}
      </div>

      {/* Alertas conteo */}
      <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
        {rojos > 0 && (
          <span style={{ background: 'var(--error-bg)', color: 'var(--error-tx)', border: '1px solid var(--error-bd)', borderRadius: 9999, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
            ⚠ {rojos} conflicto{rojos !== 1 ? 's' : ''}
          </span>
        )}
        {ambar > 0 && (
          <span style={{ background: 'var(--warn-bg)', color: 'var(--warn-tx)', border: '1px solid var(--warn-bd)', borderRadius: 9999, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
            ⚡ {ambar} aviso{ambar !== 1 ? 's' : ''}
          </span>
        )}
        {rojos === 0 && ambar === 0 && (
          <span style={{ background: 'var(--ok-bg)', color: 'var(--ok-tx)', border: '1px solid var(--ok-bd)', borderRadius: 9999, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
            ✓ Sin conflictos
          </span>
        )}
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleExport} style={actionBtnStyle} title="Exportar plan como JSON">
          ↓ Exportar
        </button>
        <button onClick={handleImport} style={actionBtnStyle} title="Importar plan desde JSON">
          ↑ Importar
        </button>
        <button
          onClick={() => { if (confirm('¿Resetear al plan original del board?')) resetToSeed() }}
          style={{ ...actionBtnStyle, color: 'var(--error-tx)', borderColor: 'var(--error-bd)' }}
          title="Volver al seed original"
        >
          ↺ Reset
        </button>
      </div>
    </div>
  )
}

const actionBtnStyle: CSSProperties = {
  padding: '5px 16px',
  border: '1.5px solid var(--line)',
  borderRadius: 9999,
  background: 'var(--white)',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--t1)',
}
