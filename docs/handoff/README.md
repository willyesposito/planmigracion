# Handoff: Simulador de Migración Meta4 → Axton

## Overview
Mesa de planificación interactiva para la migración de payroll **Meta4 → Axton** de Hidalgo
& Asociados. Muestra el plan como un **Gantt** (filas = personas del equipo, columnas =
semanas, barras = fases de cada cuenta) y detecta **colapsos** en vivo mientras se mueven
las fases: sobreasignación de personas, dependencias fuera de orden y el "acantilado" de
Susi al pasar a Toyota. Permite mover cuentas/fases por drag & drop, gestionar equipo y
cuentas, ver insights agregados y exportar un resumen ejecutivo para stakeholders.

## About the Design Files
El archivo **`Simulador de Migración.dc.html`** de este bundle es una **referencia de
diseño en HTML** — un prototipo funcional que muestra el look & feel y el comportamiento
buscados. **No es código de producción para copiar tal cual.** La tarea es **recrear estas
capacidades en el codebase real existente** (el proyecto Vite + React + TypeScript que vive
en `uploads/Implementaciones/plan-simulador/`), usando sus patrones ya establecidos
(Zustand store, `rules.ts`, `components/`), no reescribir todo desde cero.

El prototipo se puede abrir directo en el navegador (incluye `support.js`, el bundle del
design system y el logo, con sus rutas relativas) para verlo y probarlo.

## Fidelity
**Alta fidelidad (hi-fi).** Colores, tipografía, espaciado e interacciones son finales y
están alineados al **H&A Design System**. Recrear la UI con fidelidad usando las librerías
y patrones del codebase.

## Estado actual del codebase vs. prototipo
El codebase `plan-simulador` ya implementa: modelo de datos tipado, loader desde `/data`,
store Zustand con persistencia, el **motor de las 3 reglas** (`rules.ts`), el timeline
(solo lectura) y un `ClientPanel` de edición por formulario, más toggle de tema.

El prototipo **agrega/mejora** lo siguiente (esto es lo que hay que portar):

| Capacidad nueva | Dónde encaja en el codebase |
|---|---|
| **Drag & drop en el timeline** (mover fase en el tiempo, reasignar persona arrastrando a otra fila, estirar duración por el borde) | Reescribir `components/Timeline.tsx` (hoy read-only) con handlers de mouse + `store.updateAsignacion` |
| **Mover cuenta entera** (Shift+drag o botones ±1 semana) | Acción nueva `shiftAccount(proyectoId, semanas)` en el store |
| **Conflictos en vivo** (celdas tintadas por carga, barras resaltadas, recálculo al instante) | Ya hay `recompute()` en el store; falta la capa visual en el timeline |
| **Líneas de dependencia** (flechas relev→config→pruebas, rojas si violan orden) | Overlay SVG dentro del Timeline para la cuenta seleccionada |
| **Gestión de equipo** (alta/baja de personas con rol predefinido) | Acciones `addPersona/removePersona` + modal; sumar `rol` a `Persona` |
| **Alta de cuentas** (crea proyecto + 3 fases encadenadas autoasignadas por rol) | Acciones `addProyecto` + creación de las 3 `Asignacion` |
| **Vista Insights** (KPIs, conflictos por regla, cuentas por estado, entregas por trimestre, carga del equipo) | Componente/ruta nueva que lee del store |
| **Resumen ejecutivo descargable** (hoja imprimible a PDF + copiar para mail) | Componente nuevo que serializa el estado vivo a un reporte + `window.print()` |

## Screens / Views

### 1. Timeline (vista principal)
- **Layout:** columna full-height. Header (54px) + barra de config (perilla + conteos +
  acciones) + cuerpo en fila: **rail de cuentas** (218px, izquierda) · **Gantt** (centro,
  scroll horizontal y vertical) · **panel de detalle** (336px, derecha).
- **Gantt:** primera columna sticky con nombre de persona + tag de rol; header de semanas
  sticky (mes + día); filas alternadas; barras absolutas posicionadas por semana.
  - Barra de fase: alto 26px, radio 6px, color por tipo (ver tokens), label
    `"{Cuenta} · {Tipo corto}"`, cursor `grab`. Borde derecho = grip de resize (`ew-resize`).
    Si viola R1/R3 → relleno rojo `#E85518`. Si la persona está sobreasignada esa semana →
    anillo (box-shadow) rojo/ámbar. No seleccionada (con otra cuenta activa) → opacidad 0.38.
  - Celdas con carga >100% → fondo `rgba(232,85,24,0.15)`; 80–99% → `rgba(245,158,11,0.16)`.
  - Línea vertical dashed roja en la fecha de transición de Susi, con etiqueta "Susi → Toyota".
- **Rail de cuentas:** cabecera "{n} cuentas" + botones **Equipo** y **+ Cuenta**. Cada
  ítem: punto de estado (verde/ámbar/rojo), nombre, "desde {fecha}", badges (TASA / QW / ×n).
  Orden cronológico por primera fase. Click → selecciona, resalta y hace scroll.
- **Panel de detalle:** título de cuenta + badges; "Mover cuenta entera" (◀ 1 sem / 1 sem ▶);
  por cada fase (Relevamiento / Configuración / Pruebas): select de persona, duración ±,
  fecha inicio, fin calculado, y mensajes de conflicto. Si no hay selección, muestra ayuda.

### 2. Insights (pestaña)
Dashboard con: fila de 6 KPIs (conflictos, avisos, cuentas en riesgo, entrega estimada,
total cuentas, total personas); "Conflictos por regla" (barras R2/R3/R1); "Cuentas por
estado" (3 chips); "Entregas por trimestre" (barras); "Carga del equipo" (barras de semanas
sobreasignadas por persona).

### 3. Resumen ejecutivo (overlay, descargable)
Hoja A4 blanca con marca H&A: encabezado + fecha; 4 KPIs; perilla de transición; riesgos
agrupados por regla; tabla de cuentas (estado/desde/entrega). Botones: **Copiar para mail**
(texto plano al portapapeles), **Imprimir / Guardar PDF** (oculta el chrome y `window.print()`),
**Cerrar**. Se genera del **estado vivo** (refleja los cambios hechos).

### 4. Modales: Equipo y Agregar cuenta
- **Equipo:** alta (alias + rol segmentado Relev./Config./Pruebas) y baja (no permite borrar
  personas con fases asignadas).
- **Agregar cuenta:** nombre + fecha de inicio (pre-cargada al próximo lunes). Crea el
  proyecto y 3 fases encadenadas (Relevamiento→Configuración→Pruebas) asignadas por rol.

## Interactions & Behavior
- **Drag horizontal:** mueve la fase en el tiempo, con snap a semanas (recalcula `fin`
  manteniendo duración). **Drag vertical:** reasigna a la persona de la fila destino.
  **Shift + drag** (o toggle "mover cuenta entera"): mueve las 3 fases de la cuenta juntas.
  **Borde derecho:** estira/acorta la duración (recalcula días hábiles).
- **Recálculo en vivo:** cada cambio recomputa las violaciones → barras/celdas/contadores
  se actualizan al instante. Transición CSS `0.18s cubic-bezier(.4,0,.2,1)` al reubicar.
- **Persistencia:** todo se guarda en `localStorage` (key `simulador-ha-dc-v1`): personas,
  proyectos, asignaciones, transición y tema. **Reset** vuelve al seed original del board.
- **Tema:** toggle claro/oscuro persistido.

## State Management
Estado (en el prototipo, mapear al store Zustand existente):
- `personas: { id, alias, rol, capacidad_horas_semana, buffer_pct }[]` — `rol` ∈
  `relevamiento | configuracion | pruebas` (NUEVO campo a sumar a `types.ts`).
- `proyectos: { id, nombre, complejidad|null, depende_retro|null, entidades, quick_win, especial }[]`
- `asignaciones: { id, proyecto_id|null, tipo, persona_id, inicio, fin, duracion_dias, dedicacion_pct, predecesoras[], es_bloqueo }[]`
- `config` (perillas, horizonte, feriados) · `transicion` (fecha Susi) · `theme` · `selectedProyecto`.
- Acciones: `updateAsignacion`, `shiftAccount`, `addPersona`, `removePersona`, `addProyecto`,
  `setTransition`, `reset`, `recompute` (deriva `violaciones`).

### Motor de reglas (igual al `rules.ts` existente)
- **R1 — Acantilado Susi:** fase `Configuracion` de `susi` (no bloqueo, proyecto no
  `especial`) con `fin >= transicion` → ROJO.
- **R2 — Sobreasignación:** por persona × semana, `carga = Σ dedicacion_pct` de fases
  activas. >100% → ROJO; 80–99% → ÁMBAR. (Semana plena = 5 días = 40 hs.)
- **R3 — Dependencias:** fase con `inicio < max(fin de predecesoras)` → ROJO.

## Design Tokens
Fuente UI: **Plus Jakarta Sans** (app interna). Reportes formales: **Source Sans Pro**.

**Tema claro:** pageBg `#EEF2F7` · panel `#FFFFFF` · panelAlt `#F7F9FB` · line `#E2E6EC` ·
ink `#1E3A5F` · t2 `#4A6080` · t3 `#8FA3BA` · celeste `#00ACD4` · celesteDark `#0090B4`.
**Tema oscuro:** pageBg `#0A131E` · panel `#101C2A` · panelAlt `#0D1825` · line `#22344A` ·
ink `#E8F0F8` · t2 `#9DB0C6` · t3 `#62788F` · celeste `#27C3E6`.

**Colores por tipo de fase:** Relevamiento `#7B2FBE` · Configuración `#0E86C4` (azul) /
celeste de marca `#00ACD4` en leyenda · Pruebas `#2FA35A` · Bloqueo/Vacaciones gris `#8C837B`.
**Estado:** success `#22C55E` · warning `#F59E0B` · error/urgente `#E85518` · info `#00ACD4`.
**Radios:** sm 8 · 14 · full 9999 (pills siempre). **Easing:** `cubic-bezier(.4,0,.2,1)`,
duración 0.22s.

## Assets
- `assets/logo-ha.png` — isotipo oficial H&A (círculo celeste, monograma blanco, 252×252).
  En el codebase real usar el asset de branding existente.

## Files (en este bundle)
- `Simulador de Migración.dc.html` — prototipo de referencia (abrir en navegador).
- `support.js`, `_ds/…/colors_and_type.css`, `_ds/…/_ds_bundle.js`, `assets/logo-ha.png` —
  dependencias para que el prototipo abra offline.
- `PASO_A_PASO_CLAUDE_CODE.md` — guía paso a paso para continuar en Claude Code.
- `SUGERENCIAS.md` — roadmap de mejoras.

## Codebase de destino
El proyecto real (Vite + React + TS + Zustand) está en
`uploads/Implementaciones/plan-simulador/`. Archivos clave: `src/store.ts`,
`src/rules.ts`, `src/types.ts`, `src/utils/dates.ts`, `src/components/{Timeline,ClientPanel,ConfigPanel}.tsx`,
`data/*.json`, `docs/{spec,metodologia-fases,glosario}.md`.
