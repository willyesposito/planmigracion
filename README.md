# Simulador de capacidad y dependencias — Migración Meta 4 → Axton

Mesa de planificación local para jugar con los tiempos de los proyectos de migración y
detectar colapsos **antes** de comprometer fechas. Pensado para construirse con Claude Code.

## Cómo arrancar con Claude Code
1. Abrí Claude Code **dentro de esta carpeta**.
2. Primer prompt sugerido:
   > Leé `CLAUDE.md` completo y después `docs/spec.md`, `docs/metodologia-fases.md` y
   > `docs/glosario.md`. Construí el MVP según `spec.md` usando **solo** los datos de
   > `/data` (no inventes datos; respetá los `null`). Empezá por el modelo de datos
   > tipado y el loader, después el timeline grid, y después las reglas en este orden:
   > Regla 2 (sobreasignación), Regla 3 (dependencias), Regla 1 (acantilado Susana).
   > No implementes las reglas de roadmap todavía. Idioma de UI: español (Argentina).
3. Cuando esté el MVP: `npm install && npm run dev`.

## Mapa de la carpeta
```
plan-simulador/
├─ CLAUDE.md                ← contexto + reglas + stack (leer primero)
├─ docs/
│  ├─ spec.md               ← contrato funcional, las 3 reglas, modelo de datos
│  ├─ metodologia-fases.md  ← fases, gate de UAT, dependencias
│  └─ glosario.md           ← unidades, estados, alias, cuentas, fechas
├─ data/
│  ├─ personas.json         ← equipo + capacidad + skills (solo alias)
│  ├─ proyectos.json        ← cuentas + complejidad + flags
│  ├─ asignaciones.json     ← fases en el tiempo (seed del board actual)
│  └─ config.json           ← perillas: transición de Susi, retro, jornada, feriados
└─ src/                     ← lo construye Claude Code
```

## Validación rápida (que el motor anda)
El seed es un baseline limpio: al cargarlo, todo verde. Para probar:
- Poné `transicion_susana_toyota` en `2026-08-01` → TASA-config **no** se marca; otras
  configs de Susi posteriores, sí.
- Solapá dos fases de `moni` en una semana → rojo (Regla 2).
- Adelantá `pof-config` antes del 15/5 → rojo (Regla 3).

## Pendiente de confirmar (datos en `null`, NO inventados)
1. **Complejidad 1–10 por cuenta** → board de complejidad de Monday (ID `6552205482`).
2. **`depende_retro` por cuenta** → del relevamiento (bloque B del checklist).
3. **Capacidades reales** (Susi freelance, disponibilidad parcial de Leo/Sergio).
4. **Fechas de las barras** → leídas de la captura, ajustar a tu board real.
5. **Pisos de soporte (Moni/Leo)** → para la regla de SLA (roadmap).

## Regla de privacidad
Solo alias (`leo`, `moni`, `susi`…) y nombres comerciales de cuenta. **Nunca** nombres de
empleados, CUIT/CUIL, sueldos ni legajos.
