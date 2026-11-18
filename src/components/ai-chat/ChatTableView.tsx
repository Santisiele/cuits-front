import { useNavigate } from "react-router-dom"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { exportNodes } from "@/lib/exportTable"
import { cellText, cuitOf, tableExport, tableFileName } from "@/lib/aiChat"
import { useStore } from "@/store/useStore"
import type { AiChatTable } from "@/types"

const SHOWN_ROWS = 100

export function ChatTableView({ table }: { table: AiChatTable }) {
  const { setEditTaxId } = useStore()
  const navigate = useNavigate()

  function openNode(taxId: string): void {
    setEditTaxId(taxId)
    void navigate("/edit")
  }

  function download(format: "csv" | "xlsx"): void {
    const { rows, columns } = tableExport(table)
    exportNodes(rows, columns, tableFileName(table.title), format)
  }

  const shown = table.rows.slice(0, SHOWN_ROWS)

  return (
    <div className="border border-border">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/40">
        <p className="text-sm font-medium">
          {table.title}{" "}
          <span className="text-muted-foreground font-normal">
            · {table.rows.length} {table.rows.length === 1 ? "fila" : "filas"}
          </span>
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => download("xlsx")}>
            <Download className="size-4" /> Excel
          </Button>
          <Button size="sm" variant="outline" onClick={() => download("csv")}>
            <Download className="size-4" /> CSV
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto max-h-96">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-background">
            <tr className="border-b border-border text-muted-foreground">
              {table.columns.map((column) => (
                <th key={column} className="text-left py-1.5 px-3 font-medium whitespace-nowrap">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-border last:border-0">
                {table.columns.map((column, index) => {
                  const cuit = cuitOf(row[index])
                  return (
                    <td key={column} className="py-1.5 px-3 align-top">
                      {cuit ? (
                        <button
                          type="button"
                          onClick={() => openNode(cuit)}
                          className="font-mono text-cyan-600 dark:text-cyan-400 hover:underline"
                        >
                          {cuit}
                        </button>
                      ) : (
                        <span className="break-words">{cellText(row[index])}</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(table.rows.length > SHOWN_ROWS || table.truncated) && (
        <p className="px-3 py-2 text-xs text-muted-foreground border-t border-border">
          {table.rows.length > SHOWN_ROWS && `Se ven las primeras ${SHOWN_ROWS} filas; la descarga trae las ${table.rows.length}. `}
          {table.truncated && "El listado se cortó en 5000 filas."}
        </p>
      )}
    </div>
  )
}
