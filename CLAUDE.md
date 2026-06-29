# CLAUDE.md — Contexto para Claude Code

> Este es el archivo que tenés que leer **primero y completo**. Define qué construir,
> con qué reglas y con qué datos. Después leé `docs/spec.md` (contrato funcional),
> `docs/metodologia-fases.md` y `docs/glosario.md`.

---

## 1. Qué estamos construyendo

Un **simulador local de capacidad y dependencias** para planificar la migración de
~13 cuentas estándar de Meta 4 a Axton (más Toyota/TASA como proyecto especial) en
Hidalgo & Asociados.

Es una **mesa de planificación "qué pasa si…"**: el usuario mueve fechas, asignaciones
y perillas, y la herramienta **detecta colapsos de tiempo de forma proactiva** y los
pinta. Reemplaza el trabajo manual de mirar la vista "Carga de trabajo" de Monday y
adivinar a ojo dónde hay sobrecarga o dependencias rotas.

### Qué NO es
- **No** es un reemplazo de Monday. Monday sigue siendo la fuente de verdad de la
  ejecución. Esto es planificación previa.
- **No** se conecta a la API de Monday (decisión tomada: standalone puro, datos a mano).
- **No** maneja datos personales. Ver sección 5.

---

## 2. El valor central: las 3 reglas de colapso (MVP)

El corazón de la herramienta es un **motor de reglas** que evalúa el plan y marca
problemas. En este MVP implementamos **solo estas 3** (las demás van en roadmap, ver
`docs/spec.md` §6). El detalle exacto de cada regla está en `docs/spec.md` §3.

1. **Acantilado Susana → Toyota.** Toda fase de *Configuración* asignada a `susi` que
   cruce o sea posterior a su fecha de pase a Toyota se marca en rojo (excepto si el
   proyecto es TASA/Toyota). La fecha es una **perilla** que el usuario mueve.
2. **Sobreasignación por persona/semana.** Si la suma de dedicación de las fases activas
   de una persona en una semana supera su capacidad → rojo. Cerca del límite → ámbar.
3. **Violación de dependencia entre fases.** Una fase no puede arrancar antes de que
   terminen sus predecesoras. Caso especial: *Paralelo* no arranca sin gate de *UAT*
   cerrado.

---

## 3. Stack técnico

- **React + Vite + TypeScript.** TS es obligatorio: los tipos *son* el modelo de datos.
  No rompas el schema al iterar.
- **Timeline hecho a mano con CSS Grid.** NO uses librerías de Gantt pesadas; necesitamos
  control total para meter la lógica de colapsos y la línea de transición de Susana.
- **Zustand** para estado, **date-fns** para matemática de semanas/fechas.
- **Persistencia: localStorage + import/export JSON.** Sin backend.
- Idioma de la UI: **español (Argentina)**.

---

## 4. Fuente de datos: la carpeta `/data`

**No inventes datos.** Todo lo que la app necesita sale de `/data`:

- `personas.json` — recursos, capacidad (horas/semana), skills.
- `proyectos.json` — cuentas, complejidad, flags (retro, entidades, quick-win).
- `asignaciones.json` — fases ubicadas en el tiempo (el seed real del board actual).
- `config.json` — perillas globales: fecha de transición de Susana, retro-ready de Axton,
  jornada, feriados, pisos de soporte.

Varios campos están en `null` con una nota `_confirmar` o `_nota`. **Respetá esos null:**
la UI debe mostrar "sin definir / sin clasificar", no rellenar con valores inventados.
El usuario los va a completar a mano.

---

## 5. Privacidad (regla dura, no negociable)

**Nunca** uses ni pidas nombres reales de personas, CUITs, CUILs, sueldos individuales ni
legajos. El equipo se identifica solo por alias (`leo`, `moni`, `susi`, `lau`, `sergio`,
`lucas`). Las cuentas se identifican por su nombre comercial tal como ya figura en los
documentos del proyecto. Si en algún momento aparece un dato personal en un archivo de
datos, es un error: ignoralo y avisá.

---

## 6. Cómo construir (orden sugerido)

1. **Modelo de datos tipado** (`src/types.ts`) que matchee los 4 JSON de `/data`. Loader
   que valide que los JSON cumplen el schema al arrancar.
2. **Timeline grid**: personas en filas, semanas en columnas, barras de fase posicionadas
   por fecha. Que se vea limpio y se entienda de un vistazo (el objetivo es superar la
   vista de Monday, no empatarla).
3. **Regla 2** (sobreasignación) — la más visual y la que valida que el cálculo de
   capacidad anda.
4. **Regla 3** (dependencias).
5. **Regla 1** (acantilado Susana) + línea vertical en la fecha de transición.
6. **Perillas editables** + recálculo en vivo + persistencia + export/import JSON.

No agregues las reglas de roadmap (feeder de relevamiento, bloqueo por retro, piso de
soporte, tiempo externo) hasta que el MVP esté validado.

---

## 7. Cómo se valida que está bien

El seed de `/data` es un **baseline limpio a propósito** (sin colapsos). Al cargarlo,
todo debería verse verde. Después el usuario rompe cosas para probar el motor:

1. Definir `transicion_susana_toyota` (ej. `2026-08-01`) → TASA-config NO debería marcarse
   (TASA es Toyota); cualquier otra config de Susi posterior, sí.
2. Solapar a propósito dos fases de `moni` en una misma semana → Regla 2 debe pintar rojo.
3. Adelantar `pof-config` antes del fin de `pof-relev` (15/5) → Regla 3 debe marcar la
   violación de dependencia.

Si esos tres comportamientos andan, el MVP está calibrado.

---

## 8. Convenciones

- Comentarios y labels en español. Nombres de variables/tipos en inglés está bien.
- Mantené el schema de datos estable; si necesitás un campo nuevo, agregalo al JSON y al
  tipo, nunca hardcodees datos en el código.
- Errores y warnings del motor de reglas: que sean legibles para un PM, no para un dev
  (ej. "Susi configura POF después de pasar a Toyota", no "constraint violation R1").
