const PESOS = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 })

export function formatPesos(amount: number): string {
  return `$ ${PESOS.format(amount)}`
}
