import { parseISO, addDays, startOfWeek, format, addWeeks } from 'date-fns'
import { es } from 'date-fns/locale'

export function parseDate(s: string): Date {
  return parseISO(s)
}

export function toISO(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

export function formatFecha(d: Date | string): string {
  const date = typeof d === 'string' ? parseISO(d) : d
  return format(date, "d MMM yyyy", { locale: es })
}

export function formatFechaCorta(d: Date | string): string {
  const date = typeof d === 'string' ? parseISO(d) : d
  return format(date, "d MMM", { locale: es })
}

export function getMondayOfWeek(d: Date): Date {
  return startOfWeek(d, { weekStartsOn: 1 })
}

function isWeekend(d: Date): boolean {
  return d.getDay() === 0 || d.getDay() === 6
}

function nextWorkingDay(d: Date): Date {
  let result = new Date(d)
  while (isWeekend(result)) {
    result = addDays(result, 1)
  }
  return result
}

/** Calcula la fecha fin dado un inicio (ISO) y duración en días hábiles (inclusivo). */
export function calcularFin(inicio: string, duracionDias: number): string {
  let d = nextWorkingDay(parseISO(inicio))
  let count = 1
  while (count < duracionDias) {
    d = addDays(d, 1)
    if (!isWeekend(d)) count++
  }
  return toISO(d)
}

/** Genera todos los lunes entre dos fechas ISO. */
export function getSemanas(desde: string, hasta: string): Date[] {
  const result: Date[] = []
  let current = getMondayOfWeek(parseISO(desde))
  const end = parseISO(hasta)
  while (current <= end) {
    result.push(current)
    current = addWeeks(current, 1)
  }
  return result
}

/** Índice (0-based) de la semana en la que cae una fecha, relativo a una semana inicial. */
export function semanaIndex(fecha: string, desdeLunes: Date): number {
  const lunes = getMondayOfWeek(parseISO(fecha))
  const diffMs = lunes.getTime() - desdeLunes.getTime()
  return Math.floor(diffMs / (7 * 24 * 3600 * 1000))
}

/** Verifica si dos rangos de fechas se solapan (inclusive). */
export function seSuperponen(inicio1: string, fin1: string, inicio2: string, fin2: string): boolean {
  return inicio1 <= fin2 && fin1 >= inicio2
}
