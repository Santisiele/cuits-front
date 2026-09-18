import { useState } from "react"
import { ColumnFilter } from "@/components/ColumnFilter"
import { optionsFrom, passesFilter } from "@/lib/columnFilters"
import { formatPesos } from "@/lib/money"
import type { FinancieraLender } from "@/types"

function lenderValues(lender: FinancieraLender): string[] {
  return [lender.entityName]
}

export function FinancieraLenders({ lenders }: { lenders: FinancieraLender[] }) {
  const [hidden, setHidden] = useState<string[]>([])
  if (lenders.length === 0) return null

  const hiddenSet = new Set(hidden)
  const shown = lenders.filter((lender) => passesFilter(lenderValues(lender), hiddenSet))

  return (
    <div className="space-y-2 mb-4">
      <p className="text-sm font-medium">Financieras a las que le pidió</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-1.5 pr-3 text-muted-foreground font-medium">
              <ColumnFilter
                label="Financiera"
                options={optionsFrom(lenders, lenderValues, { emptyLabel: "Sin nombre" })}
                hidden={hidden}
                onChange={setHidden}
              />
            </th>
            <th className="text-right py-1.5 px-3 text-muted-foreground font-medium">Veces</th>
            <th className="text-right py-1.5 pl-3 text-muted-foreground font-medium">Préstamo total</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((lender) => (
            <tr key={lender.entityName} className="border-b border-border last:border-0">
              <td className="py-1.5 pr-3">{lender.entityName || "Sin nombre"}</td>
              <td className="py-1.5 px-3 text-right tabular-nums">{lender.operationCount}</td>
              <td className="py-1.5 pl-3 text-right tabular-nums whitespace-nowrap">
                {formatPesos(lender.totalLoan)}
              </td>
            </tr>
          ))}
          {shown.length === 0 && (
            <tr>
              <td colSpan={3} className="py-3 text-center text-muted-foreground">
                Ninguna financiera coincide con el filtro
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
