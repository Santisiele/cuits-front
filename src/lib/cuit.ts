export interface ParsedCuitList {
  taxIds: string[]
  rejected: string[]
}

export function parseCuitList(raw: string): ParsedCuitList {
  const taxIds: string[] = []
  const rejected: string[] = []

  for (const token of raw.split(/[\s,;]+/).filter(Boolean)) {
    const digits = token.replace(/\D/g, "")
    if (digits.length !== 11) {
      rejected.push(token)
      continue
    }
    if (!taxIds.includes(digits)) taxIds.push(digits)
  }

  return { taxIds, rejected }
}

export function formatTaxId(taxId: string): string {
  if (taxId.length !== 11) return taxId
  return `${taxId.slice(0, 2)}-${taxId.slice(2, 10)}-${taxId.slice(10)}`
}
