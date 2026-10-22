import { formatActivityMonth } from "@/lib/activityMonths"

export function formatLenderPeriod(period: string): string {
  if (!period) return "Sin fecha"
  return formatActivityMonth(period)
}

export function formatSituation(situation: string): string {
  return situation ? `Situación ${situation}` : "Sin situación"
}
