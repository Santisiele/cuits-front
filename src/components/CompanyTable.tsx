import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useStore } from "@/store/useStore"
import { useCompanyNodes } from "@/hooks/useGraphQueries"
import type { BaseNode } from "@/types"

// ─── Types ────────────────────────────────────────────────────────────────────

type SortField = "businessName" | "relationshipCount"
type SortDir = "asc" | "desc"

// ─── Sort button ──────────────────────────────────────────────────────────────

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

// ─── Component ───────────────────────────────────────────────────────────────

export function CompanyTable() {
  const { setActiveTab, setEditTaxId } = useStore()

  const { data: nodes = [], isLoading: loading, error } = useCompanyNodes()
  const [search, setSearch] = useState("")
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<SortField>("relationshipCount")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const sources = Array.from(new Set(nodes.map((n) => n.source).filter(Boolean)))

  function toggleSource(source: string): void {
    setSelectedSources((prev) => {
      const next = new Set(prev)
      next.has(source) ? next.delete(source) : next.add(source)
      return next
    })
  }

  function handleSort(field: SortField): void {
    if (field === sortField) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  function handleNodeClick(taxId: string): void {
    setEditTaxId(taxId)
    setActiveTab("edit")
  }

  const filtered = nodes
    .filter((node) => {
      const matchesSearch =
        node.businessName.toLowerCase().includes(search.toLowerCase()) ||
        node.taxId.includes(search)
      const matchesSource =
        selectedSources.size === 0 || selectedSources.has(node.source)
      return matchesSearch && matchesSource
    })
    .sort((a: BaseNode, b: BaseNode) => {
      let cmp = 0
      if (sortField === "businessName") {
        cmp = (a.businessName ?? "").localeCompare(b.businessName ?? "")
      } else if (sortField === "relationshipCount") {
        cmp = (a.relationshipCount ?? 0) - (b.relationshipCount ?? 0)
      }
      return sortDir === "asc" ? cmp : -cmp
    })

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
          <CardTitle>Empresas a buscar ({nodes.length})</CardTitle>
          <Input
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o CUIT..."
            className="w-full sm:w-64"
          />
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
          <p className="text-destructive text-sm">Error al cargar las empresas</p>
        ) : (
          <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 300px)" }}>
            {/* Desktop table */}
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
                    <SortButton field="relationshipCount" current={sortField} dir={sortDir} onSort={handleSort}>
                      En mi base
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

            {/* Mobile list */}
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
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{node.source || "—"}</Badge>
                    <span className="text-xs text-muted-foreground">{node.relationshipCount} en mi base</span>
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