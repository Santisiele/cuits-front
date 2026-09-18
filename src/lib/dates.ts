export function toIsoDate(ddmmyyyy: string): string {
  const match = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(ddmmyyyy.trim())
  if (!match) return ""
  const [, d, m, y] = match
  return `${y}-${m!.padStart(2, "0")}-${d!.padStart(2, "0")}`
}

export function fromIsoDate(yyyymmdd: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(yyyymmdd.trim())
  if (!match) return ""
  const [, y, m, d] = match
  return `${d}/${m}/${y}`
}

export function todayString(now: Date = new Date()): string {
  return `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`
}

export function daysFromTodayString(days: number, now: Date = new Date()): string {
  const shifted = new Date(now)
  shifted.setDate(shifted.getDate() + days)
  return todayString(shifted)
}

export function rangeEndsBeforeItStarts(from: string, to: string): boolean {
  const start = toIsoDate(from)
  const end = toIsoDate(to)
  if (!start || !end) return false
  return end < start
}
