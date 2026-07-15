import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useStore } from "@/store/useStore"
import { useNavigate } from "react-router-dom"
import { useToKnowNodes } from "@/hooks/useGraphQueries"
import { exportNodes } from "@/lib/exportTable"
import { Button } from "@/components/ui/button"
import type { BaseNode } from "@/types"

type SortField = "businessName" | "sources" | "relationshipCount"
type SortDir = "asc" | "desc"

function SortButton({
  field,
  current,
  dir,
  onSort,
  children,
}: {
  field: SortField
  current: SortField
  dir: SortDir
  onSort: (f: SortField) => void
  children: React.ReactNode
}) {
  const active = field === current
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 mx-auto hover:text-foreground transition-colors"
    >
      {children}
      <span className="text-xs leading-none">
        {active ? (dir === "asc" ? "↑" : "↓") : <span className="opacity-30">↕</span>}
      </span>
    </button>
  )
}

const TO_KNOW_COLUMNS = [
  { key: "taxId" as const,             label: "CUIT" },
  { key: "businessName" as const,      label: "Nombre" },
  { key: "sources" as const,           label: "Fuentes" },
  { key: "relationshipCount" as const, label: "Relaciones" },
]

/**
 * Tab panel listing all "por conocer" nodes (isToKnow=true).
 *
 * Same filter surface as "Mi base":
 *   - Free-text search on name + CUIT
 *   - Source chips (OR semantics — a node matches if ANY of its sources
 *     is selected)
 *   - Sortable columns
 *   - CSV / XLSX export
 *
 * State is persisted in Zustand under `toKnowTable`, so filters survive
 * navigation to other tabs and back.
 */
export function ToKnowTable() {
  const { setEditTaxId, toKnowTable, setToKnowTable } = useStore()
  const navigate = useNavigate()

  const { data: nodes = [], isLoading: loading, error } = useToKnowNodes()
  const search = toKnowTable.search
  const sortField = toKnowTable.sortField as SortField
  const sortDir = toKnowTable.sortDir as SortDir
  const selectedSources = new Set(toKnowTable.selectedSources)

  function setSearch(s: string) { setToKnowTable({ search: s }) }

  const sources = Array.from(
    new Set(nodes.flatMap((n) => n.sources ?? []).filter(Boolean))
  ).sort()

  function toggleSource(source: string): void {
    const next = new Set(selectedSources)
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    next.has(source) ? next.delete(source) : next.add(source)
    setToKnowTable({ selectedSources: Array.from(next) })
  }

  function handleSort(field: SortField): void {
    if (field === sortField) {
      setToKnowTable({ sortDir: sortDir === "asc" ? "desc" : "asc" })
    } else {
      setToKnowTable({ sortField: field, sortDir: "asc" })
    }
  }

  function handleNodeClick(taxId: string): void {
    setEditTaxId(taxId)
    void navigate("/edit")
  }

  const filtered = nodes
    .filter((node) => {
      const matchesSearch =
        node.businessName.toLowerCase().includes(search.toLowerCase()) ||
        node.taxId.includes(search)
      const matchesSource =
        selectedSources.size === 0 ||
        (node.sources ?? []).some((s) => selectedSources.has(s))
      return matchesSearch && matchesSource
    })
    .sort((a: BaseNode, b: BaseNode) => {
      let cmp = 0
      if (sortField === "businessName") {
        cmp = (a.businessName ?? "").localeCompare(b.businessName ?? "")
      } else if (sortField === "sources") {
        cmp = (a.sources ?? []).join(", ").localeCompare((b.sources ?? []).join(", "))
      } else if (sortField === "relationshipCount") {
        cmp = (a.relationshipCount ?? 0) - (b.relationshipCount ?? 0)
      }
      return sortDir === "asc" ? cmp : -cmp
    })

  const isFiltered = search.length > 0 || selectedSources.size > 0
  const title = isFiltered
    ? `Por conocer (${filtered.length} de ${nodes.length})`
    : `Por conocer (${nodes.length})`

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex gap-2 items-center">
            <Input
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o CUIT..."
              className="w-full sm:w-64"
            />
            <Button variant="outline" size="sm" onClick={() => exportNodes(filtered, TO_KNOW_COLUMNS, "por-conocer", "csv")}>CSV</Button>
            <Button variant="outline" size="sm" onClick={() => exportNodes(filtered, TO_KNOW_COLUMNS, "por-conocer", "xlsx")}>XLSX</Button>
          </div>
        </div>

        {sources.length > 0 && (
          <div className="flex gap-2 flex-wrap pt-2">
            {sources.map((source) => (
              <button key={source} onClick={() => toggleSource(source)} className="focus:outline-none">
                <Badge
                  variant={selectedSources.has(source) ? "default" : "outline"}
                  className="cursor-pointer"
                >
                  {source}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-sm">Cargando...</p>
        ) : error ? (
          <p className="text-destructive text-sm">Error al cargar los cuits</p>
        ) : (
          <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 300px)" }}>
            <table className="hidden sm:table w-full text-sm">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b border-slate-700">
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">CUIT</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">
                    <SortButton field="businessName" current={sortField} dir={sortDir} onSort={handleSort}>
                      Nombre
                    </SortButton>
                  </th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">
                    <SortButton field="sources" current={sortField} dir={sortDir} onSort={handleSort}>
                      Fuentes
                    </SortButton>
                  </th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">
                    <SortButton field="relationshipCount" current={sortField} dir={sortDir} onSort={handleSort}>
                      Relaciones
                    </SortButton>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((node) => (
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
                      <span className="text-muted-foreground">{node.relationshipCount}</span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-muted-foreground">
                      No se encontraron resultados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="sm:hidden divide-y divide-slate-800">
              {filtered.map((node) => (
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
                    <span className="text-xs text-muted-foreground">{node.relationshipCount} relaciones</span>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="py-4 text-center text-muted-foreground text-sm">
                  No se encontraron resultados
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}