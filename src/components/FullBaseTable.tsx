import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronDown } from "lucide-react"
import { useStore } from "@/store/useStore"
import { useNavigate } from "react-router-dom"
import { useFullBaseNodes } from "@/hooks/useGraphQueries"
import { useSourceCategoryMap } from "@/hooks/useSourcesQuery"
import { exportNodes } from "@/lib/exportTable"
import type { BaseNode, SourceCategory } from "@/types"

type SortField = "businessName" | "sources" | "relationshipCount"
type SortDir = "asc" | "desc"
type CategoryId = SourceCategory

const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "known",  label: "Conocidos"  },
  { id: "toKnow", label: "Por conocer" },
]

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

const FULL_BASE_COLUMNS = [
  { key: "taxId" as const,             label: "CUIT" },
  { key: "businessName" as const,      label: "Nombre" },
  { key: "sources" as const,           label: "Fuentes" },
  { key: "relationshipCount" as const, label: "Relaciones" },
]

/**
 * "Full base" tab. Shows every node the user owns (isKnown ∪ isToKnow)
 * with a source picker organised in two collapsible categories.
 *
 * Layout notes:
 *   - The Card fills the entire route slot (`h-full flex flex-col`),
 *     so no page-level scrollbar appears — everything that exceeds the
 *     Card scrolls internally inside the table area.
 *   - CardHeader (title + controls) and the category picker sit at the
 *     top and don't shrink.
 *   - The table lives in a `flex-1 min-h-0 overflow-auto` container that
 *     takes the remaining vertical space and scrolls on its own when the
 *     row count exceeds the visible area.
 *
 * Source picker behaviour:
 *   - Two collapsible categories: "Conocidos" and "Por conocer"
 *   - Both open by default. Toggle each with its chevron or use the
 *     "Expandir todo" / "Colapsar todo" buttons in the header
 *   - Category open/closed state is local (component state), not persisted
 *   - The active source persists in Zustand via `fullBaseTable.selectedSources`
 *     (single-choice — the array holds 0 or 1 entries)
 *
 * Classification comes from the backend via `useSourceCategoryMap` — the
 * (:Source) node owns its category, so a new loader needs no change here.
 */
export function FullBaseTable() {
  const { setEditTaxId, fullBaseTable, setFullBaseTable } = useStore()
  const navigate = useNavigate()

  const { data: nodes = [], isLoading: loading, error } = useFullBaseNodes()
  const search = fullBaseTable.search
  const sortField = fullBaseTable.sortField as SortField
  const sortDir = fullBaseTable.sortDir as SortDir
  const activeSource = fullBaseTable.selectedSources[0] ?? null

  const [openCategories, setOpenCategories] = useState<Set<CategoryId>>(
    new Set(CATEGORIES.map((c) => c.id))
  )

  /**
   * Categories come from the backend, where the (:Source) node owns them.
   * A source missing from the map falls back to "known" so a source created
   * after this query was cached still shows up somewhere rather than
   * disappearing from the tree.
   */
  const categoryMap = useSourceCategoryMap()

  function classify(source: string): CategoryId {
    return categoryMap[source] ?? "known"
  }

  function setSearch(s: string) { setFullBaseTable({ search: s }) }

  const sources = Array.from(
    new Set(nodes.flatMap((n) => n.sources ?? []).filter(Boolean))
  ).sort()

  const sourcesByCategory: Record<CategoryId, string[]> = { known: [], toKnow: [] }
  for (const source of sources) {
    sourcesByCategory[classify(source)].push(source)
  }

  function toggleCategory(id: CategoryId): void {
    const next = new Set(openCategories)
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    next.has(id) ? next.delete(id) : next.add(id)
    setOpenCategories(next)
  }

  function expandAll(): void {
    setOpenCategories(new Set(CATEGORIES.map((c) => c.id)))
  }

  function collapseAll(): void {
    setOpenCategories(new Set())
  }

  function selectSource(source: string): void {
    if (activeSource === source) {
      setFullBaseTable({ selectedSources: [] })
    } else {
      setFullBaseTable({ selectedSources: [source] })
    }
  }

  function handleSort(field: SortField): void {
    if (field === sortField) {
      setFullBaseTable({ sortDir: sortDir === "asc" ? "desc" : "asc" })
    } else {
      setFullBaseTable({ sortField: field, sortDir: "asc" })
    }
  }

  function handleNodeClick(taxId: string): void {
    setEditTaxId(taxId)
    void navigate("/edit")
  }

  const filtered = activeSource
    ? nodes
        .filter((node) => (node.sources ?? []).includes(activeSource))
        .filter((node) => {
          if (!search) return true
          return (
            node.businessName.toLowerCase().includes(search.toLowerCase()) ||
            node.taxId.includes(search)
          )
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
    : []

  const totalForSource = activeSource
    ? nodes.filter((n) => (n.sources ?? []).includes(activeSource)).length
    : 0
  const isFiltered = activeSource !== null && search.length > 0
  const title = activeSource
    ? isFiltered
      ? `${activeSource} (${filtered.length} de ${totalForSource})`
      : `${activeSource} (${totalForSource})`
    : "Full base"

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex gap-2 items-center flex-wrap">
            <Button variant="outline" size="sm" onClick={expandAll}>Expandir todo</Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>Colapsar todo</Button>
            {activeSource && (
              <>
                <Input
                  value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre o CUIT..."
                  className="w-full sm:w-64"
                />
                <Button variant="outline" size="sm" onClick={() => exportNodes(filtered, FULL_BASE_COLUMNS, `full-base-${activeSource}`, "csv")}>CSV</Button>
                <Button variant="outline" size="sm" onClick={() => exportNodes(filtered, FULL_BASE_COLUMNS, `full-base-${activeSource}`, "xlsx")}>XLSX</Button>
              </>
            )}
          </div>
        </div>

        {sources.length > 0 && (
          <div className="flex flex-col gap-2 pt-2">
            {CATEGORIES.map((cat) => {
              const catSources = sourcesByCategory[cat.id]
              if (catSources.length === 0) return null
              const isOpen = openCategories.has(cat.id)
              return (
                <div key={cat.id} className="flex flex-col gap-1">
                  <button
                    onClick={() => toggleCategory(cat.id)}
                    className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-fit"
                  >
                    {isOpen
                      ? <ChevronDown className="w-4 h-4" />
                      : <ChevronRight className="w-4 h-4" />}
                    <span>{cat.label}</span>
                    <span className="text-xs opacity-60">({catSources.length})</span>
                  </button>
                  {isOpen && (
                    <div className="flex gap-2 flex-wrap pl-5">
                      {catSources.map((source) => {
                        const isActive = activeSource === source
                        return (
                          <button key={source} onClick={() => selectSource(source)} className="focus:outline-none">
                            <Badge
                              variant={isActive ? "default" : "outline"}
                              className="cursor-pointer flex items-center gap-1.5"
                            >
                              <span className="text-[10px] leading-none">{isActive ? "●" : "○"}</span>
                              {source}
                            </Badge>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 min-h-0 overflow-auto">
        {loading ? (
          <p className="text-muted-foreground text-sm">Cargando...</p>
        ) : error ? (
          <p className="text-destructive text-sm">Error al cargar los cuits</p>
        ) : !activeSource ? (
          <p className="text-muted-foreground text-sm">Seleccioná una fuente para ver los cuits.</p>
        ) : (
          <>
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
          </>
        )}
      </CardContent>
    </Card>
  )
}