import { useState } from "react"
import { ColumnFilter } from "@/components/ColumnFilter"
import { optionsFrom, passesFilter } from "@/lib/columnFilters"
import { formatLenderPeriod, formatSituation } from "@/lib/lenderMonths"
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
            <th colSpan={3} className="text-left py-1.5 text-muted-foreground font-medium">
              <ColumnFilter
                label="Financiera"
                options={optionsFrom(lenders, lenderValues, { emptyLabel: "Sin nombre" })}
                hidden={hidden}
                onChange={setHidden}
              />
            </th>
          </tr>
        </thead>
        {shown.map((lender) => (
          <tbody key={lender.entityName} className="border-b border-border last:border-0">
            <tr>
              <th scope="rowgroup" colSpan={3} className="text-left pt-2 pb-1 font-medium">
                {lender.entityName || "Sin nombre"}
              </th>
            </tr>
            {lender.months.map((month, index) => (
              <tr key={`${month.period}-${index}`}>
                <td className="py-1 pl-3 pr-3">{formatLenderPeriod(month.period)}</td>
                <td className="py-1 px-3 text-muted-foreground whitespace-nowrap">
                  {formatSituation(month.situation)}
                </td>
                <td className="py-1 pl-3 text-right tabular-nums whitespace-nowrap">
                  {formatPesos(month.totalLoan)}
                </td>
              </tr>
            ))}
          </tbody>
        ))}
        {shown.length === 0 && (
          <tbody>
            <tr>
              <td colSpan={3} className="py-3 text-center text-muted-foreground">
                Ninguna financiera coincide con el filtro
              </td>
            </tr>
          </tbody>
        )}
      </table>
    </div>
  )
}
