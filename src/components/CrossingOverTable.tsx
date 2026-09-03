import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useStore } from "@/store/useStore"
import { useNavigate } from "react-router-dom"
import { useCrossingNodes } from "@/hooks/useGraphQueries"
import { useSourcesQuery } from "@/hooks/useSourcesQuery"
import { exportNodes } from "@/lib/exportTable"
import type { CrossingNode } from "@/types"

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

const CROSSING_OVER_COLUMNS = [
  { key: "taxId" as const,             label: "CUIT" },
  { key: "businessName" as const,      label: "Nombre" },
  { key: "sources" as const,           label: "Fuentes" },
  { key: "indirectSources" as const,   label: "Por relación con" },
  { key: "relationshipCount" as const, label: "Relaciones" },
]

/**
 * "Crossing over" tab. Given a multi-select of sources, shows only nodes
 * that belong to ALL selected sources at once (AND / intersection).
 *
 * A node with extra sources beyond the selection is still shown — the
 * filter only requires the selected subset to be present. Example:
 *   selected = [A, B]
 *   node X: sources = [A, C]     → NO (missing B)
 *   node Y: sources = [B]        → NO (missing A)
 *   node Z: sources = [A, B, C]  → YES (has both A and B; C is irrelevant)
 *
 * A company (CUIT 30/33) also counts as belonging to a source when it is
 * directly related to a node that has it, as long as it carries at least one
 * of the selected sources itself. Without that, crossing a source made of
 * people ("Residentes Senior Home" holds no company at all) against a source
 * made of companies returned nothing, which was the whole point of the view.
 * Those rows are marked, because "está acá por una relación" is a weaker
 * claim than "está cargada en las dos fuentes".
 *
 * Data source: GET /graph/crossing, resolved server-side and fetched per
 * selection. It used to filter a full download of the base (~27k rows) in
 * memory, which is no longer possible — the by-relation rule needs the graph,
 * and no list endpoint carries relationships.
 *
 * The table stays hidden until at least two sources are selected — a single
 * selection would just replicate one of the other views (Full base, Mi base,
 * Por conocer). The point of this view is to find the intersection.
 */
export function CrossingOverTable() {
  const { setEditTaxId, crossingOverTable, setCrossingOverTable } = useStore()
  const navigate = useNavigate()

  const { data: nodes = [], isLoading: loading, error } = useCrossingNodes(
    crossingOverTable.selectedSources
  )
  /** The chips list every registered source, not just the ones already fetched. */
  const { data: sourceInfos = [] } = useSourcesQuery()
  const search = crossingOverTable.search
  const sortField = crossingOverTable.sortField as SortField
  const sortDir = crossingOverTable.sortDir as SortDir
  const selectedSources = new Set(crossingOverTable.selectedSources)

  function setSearch(s: string) { setCrossingOverTable({ search: s }) }

  const sources = sourceInfos.map((s) => s.name).sort()

  function toggleSource(source: string): void {
    const next = new Set(selectedSources)
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    next.has(source) ? next.delete(source) : next.add(source)
    setCrossingOverTable({ selectedSources: Array.from(next) })
  }

  function handleSort(field: SortField): void {
    if (field === sortField) {
      setCrossingOverTable({ sortDir: sortDir === "asc" ? "desc" : "asc" })
    } else {
      setCrossingOverTable({ sortField: field, sortDir: "asc" })
    }
  }

  function handleNodeClick(taxId: string): void {
    setEditTaxId(taxId)
    void navigate("/edit")
  }

  const hasEnoughSelections = selectedSources.size >= 2

  /** The endpoint already resolved the intersection; only search is left. */
  const filtered = hasEnoughSelections
    ? nodes
        .filter((node) => {
          if (!search) return true
          return (
            node.businessName.toLowerCase().includes(search.toLowerCase()) ||
            node.taxId.includes(search)
          )
        })
        .sort((a: CrossingNode, b: CrossingNode) => {
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
    : []

  const totalForIntersection = hasEnoughSelections ? nodes.length : 0
  const byRelationCount = nodes.filter((n) => n.indirectSources.length > 0).length
  const isFiltered = hasEnoughSelections && search.length > 0
  const title = hasEnoughSelections
    ? isFiltered
      ? `Coincidencias (${filtered.length} de ${totalForIntersection})`
      : `Coincidencias (${totalForIntersection})`
    : "Coincidencias"

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            {/* Carries the ↗ so the badge in the rows explains itself — the
                arrow on its own reads as decoration. */}
            {byRelationCount > 0 && (
              <p className="text-xs text-muted-foreground">
                ↗ {byRelationCount}{" "}
                {byRelationCount === 1
                  ? "entra por relación directa, no por estar cargada en la fuente"
                  : "entran por relación directa, no por estar cargadas en la fuente"}
              </p>
            )}
          </div>
          {hasEnoughSelections && (
            <div className="flex gap-2 items-center flex-wrap">
              <Input
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o CUIT..."
                className="w-full sm:w-64"
              />
              <Button variant="outline" size="sm" onClick={() => exportNodes(filtered, CROSSING_OVER_COLUMNS, "crossing-over", "csv")}>CSV</Button>
              <Button variant="outline" size="sm" onClick={() => exportNodes(filtered, CROSSING_OVER_COLUMNS, "crossing-over", "xlsx")}>XLSX</Button>
            </div>
          )}
        </div>

        {sources.length > 0 && (
          <div className="flex gap-2 flex-wrap pt-2">
            {sources.map((source) => {
              const isChecked = selectedSources.has(source)
              return (
                <button key={source} onClick={() => toggleSource(source)} className="focus:outline-none">
                  <Badge
                    variant={isChecked ? "default" : "outline"}
                    className="cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="text-[11px] leading-none">{isChecked ? "☑" : "☐"}</span>
                    {source}
                  </Badge>
                </button>
              )
            })}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 min-h-0 overflow-auto">
        {/* The selection check comes first: below two sources nothing is
            fetched at all, so there is neither loading nor error to report. */}
        {!hasEnoughSelections ? (
          <p className="text-muted-foreground text-sm">Seleccioná al menos dos fuentes para ver las coincidencias.</p>
        ) : loading ? (
          <p className="text-muted-foreground text-sm">Cargando...</p>
        ) : error ? (
          <p className="text-destructive text-sm">Error al cargar los cuits</p>
        ) : (
          <>
            <table className="hidden sm:table w-full text-sm">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b border-border">
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
                    className="border-b border-border hover:bg-accent/50 transition-colors"
                  >
                    <td className="py-2 px-3 font-mono text-xs text-center">
                      <button
                        onClick={() => handleNodeClick(node.taxId)}
                        className="cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                      >
                        {node.taxId}
                      </button>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => handleNodeClick(node.taxId)}
                        className="cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
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
                        {/* Filled badge, so a row that is only here through a
                            neighbour never reads like a plain member. */}
                        {node.indirectSources.map((s) => (
                          <Badge
                            key={s}
                            variant="secondary"
                            className="text-xs"
                            title="Pertenece a esta fuente por una relación directa, no por estar cargada en ella"
                          >
                            ↗ {s}
                          </Badge>
                        ))}
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
                      No hay cuits que estén en todas las fuentes seleccionadas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="sm:hidden divide-y divide-border">
              {filtered.map((node) => (
                <div
                  key={node.taxId}
                  className="py-3 px-1 hover:bg-accent/50 transition-colors"
                >
                  <button
                    onClick={() => handleNodeClick(node.taxId)}
                    className="font-mono text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 dark:text-cyan-300 transition-colors mb-1"
                  >
                    {node.taxId}
                  </button>
                  <button
                    onClick={() => handleNodeClick(node.taxId)}
                    className="text-sm font-medium hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors block"
                  >
                    {node.businessName || "—"}
                  </button>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {(node.sources ?? []).map((s) => (
                      <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                    ))}
                    {node.indirectSources.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">↗ {s}</Badge>
                    ))}
                    <span className="text-xs text-muted-foreground">{node.relationshipCount} relaciones</span>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="py-4 text-center text-muted-foreground text-sm">
                  No hay cuits que estén en todas las fuentes seleccionadas
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}