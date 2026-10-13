import { fromIsoDate, formatIsoDateTime } from "@/lib/dates"

const COUNT = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 })

export const NO_SWEEP_YET = "El barrido todavía no registró actividad"

export function formatCount(value: number): string {
  return COUNT.format(value)
}

export function progressShare(part: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(1, Math.max(0, part / total))
}

export function progressPercent(part: number, total: number): number {
  return Math.round(progressShare(part, total) * 100)
}

export function peopleWithBirthdayText(withBirthday: number, knownPeople: number): string {
  return `${formatCount(withBirthday)} de ${formatCount(knownPeople)} personas con cumpleaños`
}

export function missingText(missing: number): string {
  return missing === 1 ? "Falta 1 persona" : `Faltan ${formatCount(missing)} personas`
}

export function sweepText(consultedToday: number, dailyLimit: number): string {
  return `Hoy: ${formatCount(consultedToday)} de ${formatCount(dailyLimit)} consultas`
}

export function lastUpdateText(updatedAt: string | null): string {
  const when = updatedAt ? formatIsoDateTime(updatedAt).replace(", ", " ") : ""
  return when ? `Última actualización: ${when}` : NO_SWEEP_YET
}

export function formatMissedOn(day: string): string {
  return fromIsoDate(day) || day
}

export function matchesPerson(person: { taxId: string; businessName: string }, search: string): boolean {
  const needle = search.trim().toLowerCase()
  if (!needle) return true
  const digits = needle.replace(/\D/g, "")
  return person.businessName.toLowerCase().includes(needle) || (digits !== "" && person.taxId.includes(digits))
}
