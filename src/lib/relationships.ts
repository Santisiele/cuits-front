export function relationshipSummary(total: number, withBase: number): string {
  const count = `${total} ${total === 1 ? "relación" : "relaciones"}`
  return total === 0 ? count : `${count} · ${withBase} con tu base`
}
