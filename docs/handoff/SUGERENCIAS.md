# Sugerencias / Roadmap — Simulador de Migración

Ideas para llevar la app al siguiente nivel, en orden de valor sugerido. Las 5 primeras
ya fueron aprobadas para implementar; las dejo documentadas para retomarlas en Claude Code.

> Convención del proyecto: solo **alias** del equipo (`leo`, `moni`, `susi`…) y **nombres
> comerciales** de cuenta. Nunca nombres reales, CUIT/CUIL, sueldos ni legajos.

---

## 1. Escenarios A/B (comparar planes)
**Qué:** guardar el estado completo bajo un nombre ("Susi a Toyota en agosto" vs "en
septiembre") y comparar dos escenarios lado a lado: cuántos conflictos genera cada uno,
qué cuentas cambian de estado, cómo se mueve la entrega estimada.
**Por qué:** es el corazón del "jugar con los tiempos" (estaba en el roadmap v1.5 del spec).
**Notas de implementación:** un `escenarios: Record<string, EstadoSerializado>` en el store;
botón "Guardar escenario" + selector + una vista de diff (dos columnas de KPIs/conflictos).

## 2. Deshacer / Rehacer (undo/redo)
**Qué:** pila de estados para experimentar sin miedo (Ctrl+Z / Ctrl+Shift+Z).
**Notas:** middleware de historial sobre `asignaciones` (y opcionalmente `personas`/`proyectos`).
Guardar snapshot en cada `updateAsignacion`, `shiftAccount`, `addCuenta`, etc.

## 3. Hito de go-live por cuenta
**Qué:** marcar una fecha objetivo de entrega por cuenta y avisar (rojo/ámbar) cuando la
fase de Pruebas la cruza. Mostrar el hito como un diamante/línea en el timeline.
**Notas:** campo `go_live: string | null` en `Proyecto`; nueva regla que compara
`fin(Pruebas) vs go_live`.

## 4. Reglas del roadmap (motor)
Del `docs/spec.md` original, en orden de valor:
- **Cuello de relevamiento (feeder):** demanda de configuración > oferta de relevamiento
  (Sergio + Leo ~1 cuenta/mes). Detecta cuándo se acumulan configs sin relevamiento previo.
- **Bloqueo por retro de Axton:** config de cuenta con `depende_retro = true` que arranca
  antes de `config.fechas_clave.retro_ready_axton`.
- **Piso de soporte / SLA:** carga de migración que se come las horas reservadas a soporte
  (Moni/Leo). Usa `config.pisos_soporte_horas_semana`.

## 5. Capacidad real + feriados
**Qué:** capacidad por persona distinta de 40 hs (Susi freelance parcial, disponibilidad
parcial de Leo/Sergio) y semanas con feriado que reducen la capacidad de esa semana.
**Notas:** ya existe `capacidad_horas_semana` y `buffer_pct` por persona y
`feriados_nacionales_2026` en config; falta que la Regla 2 los use (hoy capacidad fija = 40).

---

## Otras ideas (no priorizadas)
- **Importar desde Monday (CSV):** recargar el board sin tipear a mano (board
  `18393230304` "Plan Migracion Final"). Estandarizar etiquetas de estado primero.
- **Complejidad por cuenta (1–10):** del board `6552205482`; alimenta estimación de
  duración por tier y el esquema de incentivos. Hoy `complejidad = null`.
- **Filtros / búsqueda de cuentas** en el rail; agrupar por trimestre o por persona.
- **Curva de demanda vs capacidad** en Insights (config requerida vs disponible por mes).
- **Multi-usuario / compartir** (hoy es local, persistido en localStorage).
