/** Month names, indexed by the two-digit month from the API's `yyyy-mm`. */
const MONTH_NAMES: Record<string, string> = {
  "01": "Enero",
  "02": "Febrero",
  "03": "Marzo",
  "04": "Abril",
  "05": "Mayo",
  "06": "Junio",
  "07": "Julio",
  "08": "Agosto",
  "09": "Septiembre",
  "10": "Octubre",
  "11": "Noviembre",
  "12": "Diciembre",
}

/**
 * Turns the API's `yyyy-mm` into the Spanish label shown to the user, e.g.
 * "2026-05" into "Mayo 2026".
 *
 * The API answers in a neutral, sortable form and the Spanish lives here, so
 * an unexpected value is shown as-is rather than swallowed — better a raw
 * "2026-13" on screen than a month silently missing from the list.
 */
export function formatActivityMonth(month: string): string {
  const [year, monthNumber] = month.split("-")
  const name = monthNumber ? MONTH_NAMES[monthNumber] : undefined
  if (!name || !year) return month
  return `${name} ${year}`
}
