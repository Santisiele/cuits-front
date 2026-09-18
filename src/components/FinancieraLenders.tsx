import { formatPesos } from "@/lib/money"
import type { FinancieraLender } from "@/types"

export function FinancieraLenders({ lenders }: { lenders: FinancieraLender[] }) {
  if (lenders.length === 0) return null

  return (
    <div className="space-y-2 mb-4">
      <p className="text-sm font-medium">Financieras a las que le pidió</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-1.5 pr-3 text-muted-foreground font-medium">Financiera</th>
            <th className="text-right py-1.5 px-3 text-muted-foreground font-medium">Veces</th>
            <th className="text-right py-1.5 pl-3 text-muted-foreground font-medium">Préstamo total</th>
          </tr>
        </thead>
        <tbody>
          {lenders.map((lender) => (
            <tr key={lender.entityName} className="border-b border-border last:border-0">
              <td className="py-1.5 pr-3">{lender.entityName || "Sin nombre"}</td>
              <td className="py-1.5 px-3 text-right tabular-nums">{lender.operationCount}</td>
              <td className="py-1.5 pl-3 text-right tabular-nums whitespace-nowrap">
                {formatPesos(lender.totalLoan)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
