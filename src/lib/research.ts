import { formatIsoDateTime } from "@/lib/dates"

export const LIMIT_ERROR = "El tope tiene que ser un número mayor o igual a 0"

const USD = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function formatUsd(amount: number): string {
  return `US$ ${USD.format(amount)}`
}

export function parseLimit(input: string): number | null {
  const normalized = input.trim().replace(",", ".")
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null
  return Number(normalized)
}

export function limitError(input: string): string | null {
  return parseLimit(input) === null ? LIMIT_ERROR : null
}

export function spentShare(spentUsd: number, limitUsd: number): number {
  if (limitUsd <= 0) return spentUsd > 0 ? 1 : 0
  return Math.min(1, Math.max(0, spentUsd / limitUsd))
}

export function researchButtonLabel(previousCount: number): string {
  return previousCount > 0 ? "Volver a buscar" : "Buscar en la web"
}

export function researchCuit(taxId: string): string {
  return taxId.replace(/\D/g, "")
}

export function archivedText(archivedBy: string | null, archivedAt: string | null): string {
  const parts = [archivedBy, archivedAt ? formatIsoDateTime(archivedAt) : null].filter(Boolean)
  return parts.length > 0 ? parts.join(" · ") : "—"
}
