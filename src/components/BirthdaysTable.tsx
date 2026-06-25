import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useStore } from "@/store/useStore"
import { useNavigate } from "react-router-dom"
import { useBirthdays } from "@/hooks/useGraphQueries"
import { exportNodes } from "@/lib/exportTable"

// ─── Date helpers ─────────────────────────────────────────────────────────────

/**
 * Converts dd/mm/yyyy → yyyy-mm-dd for the HTML date picker.
 * Returns "" when the input can't be parsed.
 */
function toIsoDate(ddmmyyyy: string): string {
  const match = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(ddmmyyyy.trim())
  if (!match) return ""
  const [, d, m, y] = match
  return `${y}-${m!.padStart(2, "0")}-${d!.padStart(2, "0")}`
}

/**
 * Converts yyyy-mm-dd (from a date picker) into dd/mm/yyyy.
 * Returns "" when the input is empty/malformed.
 */
function fromIsoDate(yyyymmdd: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(yyyymmdd.trim())
  if (!match) return ""
  const [, y, m, d] = match
  return `${d}/${m}/${y}`
}

/** Returns today as dd/mm/yyyy. */
function todayString(): string {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
}

/** Returns today + N days as dd/mm/yyyy. */
function daysFromTodayString(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
}

// ─── Columns (for export) ────────────────────────────────────────────────────

const BIRTHDAY_COLUMNS = [
  { key: "taxId" as const,             label: "CUIT" },
  { key: "businessName" as const,      label: "Nombre" },
  { key: "sources" as const,           label: "Fuentes" },
  { key: "birthday" as const,          label: "Fecha de nacimiento" },
  { key: "relationshipCount" as const, label: "Relaciones" },
]

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Tab panel that lists inMyBase nodes whose birthday falls between two dates.
 *
 * Date pickers emit yyyy-mm-dd; we translate to dd/mm/yyyy (the backend
 * format) at the input boundary. The list arrives pre-sorted by the
 * upcoming-birthday order from the backend.
 *
 * Layout: the Card stretches the full available height (h-full + flex-col)
 * and only the table body scrolls inside it. This keeps the search controls
 * fixed at the top and avoids leaving an empty area below the table.
 */
export function BirthdaysTable() {
  const { setEditTaxId } = useStore()
  const navigate = useNavigate()

  // Default range: today → +30 days. Both stored as dd/mm/yyyy.
  const [from, setFrom] = useState<string>(todayString())
  const [to,   setTo]   = useState<string>(daysFromTodayString(30))
  const [submittedRange, setSubmittedRange] = useState<{ from: string; to: string } | null>(null)

  // Only query when the user has explicitly submitted a range.
  const birthdaysQuery = useBirthdays(
    submittedRange?.from ?? "",
    submittedRange?.to   ?? "",
    !!submittedRange
  )

  const nodes = birthdaysQuery.data ?? []
  const loading = birthdaysQuery.isFetching
  const error = birthdaysQuery.error ? (birthdaysQuery.error as Error).message : null

  function handleSearch(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault()
    if (!from || !to) return
    setSubmittedRange({ from, to })
  }

  function handleNodeClick(taxId: string): void {
    setEditTaxId(taxId)
    void navigate("/edit")
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
          <CardTitle>
            Cumpleaños{submittedRange ? ` (${nodes.length})` : ""}
          </CardTitle>
          <div className="flex gap-2 items-center">
            {submittedRange && (
              <>
                <Button variant="outline" size="sm" onClick={() => exportNodes(nodes, BIRTHDAY_COLUMNS, "cumpleanos", "csv")}>CSV</Button>
                <Button variant="outline" size="sm" onClick={() => exportNodes(nodes, BIRTHDAY_COLUMNS, "cumpleanos", "xlsx")}>XLSX</Button>
              </>
            )}
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 items-end pt-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Desde</label>
            <Input
              type="date"
              value={toIsoDate(from)}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFrom(fromIsoDate(e.target.value))}
              className="w-full sm:w-44"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Hasta</label>
            <Input
              type="date"
              value={toIsoDate(to)}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTo(fromIsoDate(e.target.value))}
              className="w-full sm:w-44"
            />
          </div>
          <Button type="submit" disabled={!from || !to || loading}>
            {loading ? "Buscando..." : "Buscar"}
          </Button>
        </form>
      </CardHeader>

      {/*
        flex-1 makes this section take all remaining height; min-h-0 lets the
        child's overflow-auto work correctly inside a flex container.
      */}
      <CardContent className="flex-1 min-h-0 overflow-auto">
        {error ? (
          <p className="text-destructive text-sm">Error al cargar cumpleaños</p>
        ) : !submittedRange ? (
          <p className="text-muted-foreground text-sm">Elegí un rango de fechas y apretá Buscar.</p>
        ) : loading ? (
          <p className="text-muted-foreground text-sm">Cargando...</p>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden sm:table w-full text-sm">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b border-slate-700">
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">CUIT</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">Nombre</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">Fuentes</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">Cumpleaños</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">Relaciones</th>
                </tr>
              </thead>
              <tbody>
                {nodes.map((node) => (
                  <tr
                    key={node.taxId}
                    className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-2 px-3 font-mono text-xs text-center">
                      <button
                        onClick={() => handleNodeClick(node.taxId)}
                        className="cursor-pointer hover:text-cyan-400 transition-colors"
                      >
                        {node.taxId}
                      </button>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => handleNodeClick(node.taxId)}
                        className="cursor-pointer hover:text-cyan-400 transition-colors"
                      >
                        {node.businessName || "—"}
                      </button>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex gap-1 flex-wrap justify-center">
                        {(node.sources ?? []).length > 0
                          ? node.sources.map((s) => (
                              <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                            ))
                          : "—"}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="text-muted-foreground">{node.birthday}</span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="text-muted-foreground">{node.relationshipCount}</span>
                    </td>
                  </tr>
                ))}
                {nodes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-muted-foreground">
                      Nadie cumple años en ese rango
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Mobile list */}
            <div className="sm:hidden divide-y divide-slate-800">
              {nodes.map((node) => (
                <div
                  key={node.taxId}
                  className="py-3 px-1 hover:bg-slate-800/50 transition-colors"
                >
                  <button
                    onClick={() => handleNodeClick(node.taxId)}
                    className="font-mono text-xs text-cyan-400 hover:text-cyan-300 transition-colors mb-1"
                  >
                    {node.taxId}
                  </button>
                  <button
                    onClick={() => handleNodeClick(node.taxId)}
                    className="text-sm font-medium hover:text-cyan-400 transition-colors block"
                  >
                    {node.businessName || "—"}
                  </button>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {(node.sources ?? []).map((s) => (
                      <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                    ))}
                    <span className="text-xs text-muted-foreground">🎂 {node.birthday}</span>
                    <span className="text-xs text-muted-foreground">{node.relationshipCount} relaciones</span>
                  </div>
                </div>
              ))}
              {nodes.length === 0 && (
                <p className="py-4 text-center text-muted-foreground text-sm">
                  Nadie cumple años en ese rango
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}