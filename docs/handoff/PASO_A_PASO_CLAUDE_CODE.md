# Paso a paso — continuar en Claude Code

Guía concreta para retomar el Simulador de Migración en **Claude Code** y portar las
mejoras del prototipo al codebase real (Vite + React + TypeScript).

---

## 0. Requisitos
- **Node.js 18+** instalado.
- **Claude Code** instalado: `npm install -g @anthropic-ai/claude-code` (o seguí
  https://docs.claude.com/claude-code).
- Tener a mano dos cosas:
  1. El **codebase real**: la carpeta `plan-simulador/` (Vite + React). Si no la tenés a
     mano, está en el proyecto original bajo `uploads/Implementaciones/plan-simulador/`.
  2. Esta carpeta de handoff (`design_handoff_simulador/`) con el prototipo y los docs.

## 1. Preparar la carpeta de trabajo
1. Copiá `design_handoff_simulador/` **dentro** de `plan-simulador/` (o al lado).
2. Abrí `Simulador de Migración.dc.html` en el navegador para **ver el objetivo** (es la
   referencia visual y de comportamiento).
3. Abrí una terminal en `plan-simulador/` y arrancá Claude Code:
   ```bash
   cd plan-simulador
   claude
   ```

## 2. Prompt inicial (pegar tal cual en Claude Code)
> Leé `design_handoff_simulador/README.md` y `design_handoff_simulador/SUGERENCIAS.md`
> completos. El prototipo objetivo es `design_handoff_simulador/Simulador de Migración.dc.html`
> (abrilo para verlo). Es una **referencia de diseño en HTML**; quiero **portar sus
> capacidades nuevas a este codebase React/Vite existente** respetando su arquitectura
> (`src/store.ts` con Zustand, `src/rules.ts`, `src/types.ts`, `src/components/`). No
> reescribas todo: extendé lo que ya está. Antes de tocar código, hacé un plan corto del
> orden de implementación y confirmámelo.

## 3. Orden de implementación recomendado
Pedile a Claude Code que vaya en este orden (un PR/commit por paso):

1. **Drag & drop en el timeline.** Reescribir `components/Timeline.tsx` (hoy solo lectura):
   arrastrar barra → `updateAsignacion` (mover fechas con snap a semana); arrastre vertical
   → reasignar `persona_id`; grip derecho → cambiar `duracion_dias`. Mantener el recálculo
   en vivo que ya hace el store.
2. **Mover cuenta entera + capa visual de conflictos.** Acción `shiftAccount(proyectoId, semanas)`
   en el store; tintar celdas por carga (R2) y resaltar barras en conflicto (R1/R3); botones
   ±1 semana en el panel de detalle.
3. **Líneas de dependencia.** Overlay SVG en el Timeline para la cuenta seleccionada
   (relev→config→pruebas), rojas si violan el orden.
4. **Gestión de equipo y cuentas.** Sumar `rol` a `Persona` en `types.ts`; acciones
   `addPersona/removePersona/addProyecto`; modales de Equipo y Agregar cuenta (crea proyecto
   + 3 fases encadenadas autoasignadas por rol).
5. **Vista Insights.** Componente nuevo que lee del store (KPIs, conflictos por regla,
   cuentas por estado, entregas por trimestre, carga del equipo).
6. **Resumen ejecutivo descargable.** Componente que serializa el estado vivo a una hoja
   imprimible (marca H&A, Source Sans Pro) con "Copiar para mail" y "Imprimir / Guardar PDF".

## 4. Levantar la app
```bash
npm install
npm run dev
```
Abrí la URL que imprime Vite (típico `http://localhost:5173`).

## 5. Verificar que el motor anda (del README/seed)
- Poné la transición de Susi en agosto/octubre → algunas configs de Susi se marcan rojas (R1).
- Solapá dos fases de la misma persona en una semana → rojo (R2, >100%).
- Adelantá una fase de Pruebas antes de cerrar su Config → rojo (R3, dependencia).
- Mové una cuenta entera y mirá cómo cambian los contadores en vivo.
- Exportá el resumen ejecutivo y revisá que refleje el estado actual.

## 6. Reglas a respetar (importante)
- **Privacidad:** solo alias del equipo y nombres comerciales de cuenta. Nunca nombres
  reales, CUIT/CUIL, sueldos ni legajos.
- **Marca:** seguir el H&A Design System (celeste `#00ACD4`, pills 9999px, Source Sans Pro
  para materiales formales). No inventar colores nuevos.
- **No inventar datos:** respetar los `null` del dataset (complejidad, depende_retro, etc.);
  los completa el usuario.

## 7. Próximos pasos
Cuando esté portado, seguir por el roadmap de `SUGERENCIAS.md` (empezando por **Escenarios A/B**).

---

### Tip
Si preferís seguir iterando el prototipo HTML en lugar del codebase React, también podés
abrir `Simulador de Migración.dc.html` en Claude Code y pedir cambios sobre ese archivo
directamente (es autónomo salvo por `support.js` y el bundle del design system, incluidos).
