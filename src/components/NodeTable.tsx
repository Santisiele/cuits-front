import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { GraphService } from "@/services/api"
import { useStore } from "@/store/useStore"
import type { BaseNode } from "@/types"

/**
 * Table that lists all nodes belonging to "my base" (inMyBase = true).
 *
 * Features:
 * - Free-text search by business name or Tax ID
 * - Source filter chips (multi-select)
 * - Clicking a CUIT navigates to the Edit Node tab pre-populated with that node
 */
export function NodeTable() {
  const { setActiveTab, setEditTaxId } = useStore()

  const [nodes, setNodes] = useState<BaseNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        const data = await GraphService.getMyBaseNodes()
        setNodes(data)
      } catch {
        setError("Error al cargar los nodos")
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  /** Unique source values extracted from the loaded nodes. */
  const sources = Array.from(new Set(nodes.map((n) => n.source).filter(Boolean)))

  /** Toggles a source filter chip on/off. */
  function toggleSource(source: string): void {
    setSelectedSources((prev) => {
      const next = new Set(prev)
      next.has(source) ? next.delete(source) : next.add(source)
      return next
    })
  }

  /** Navigates to the Edit Node tab and pre-loads the given Tax ID. */
  function handleCuitClick(taxId: string): void {
    setEditTaxId(taxId)
    setActiveTab("edit")
  }

  const filtered = nodes.filter((node) => {
    const matchesSearch =
      node.businessName.toLowerCase().includes(search.toLowerCase()) ||
      node.taxId.includes(search)
    const matchesSource =
      selectedSources.size === 0 || selectedSources.has(node.source)
    return matchesSearch && matchesSource
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Mi base ({nodes.length})</CardTitle>
          <Input
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o CUIT..."
            className="w-64"
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
          <p className="text-destructive text-sm">{error}</p>
        ) : (
          <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 300px)" }}>
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b border-slate-700">
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">CUIT</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">Nombre</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">Fuente</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">Relaciones</th>
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
                        onClick={() => handleCuitClick(node.taxId)}
                        className="cursor-pointer hover:text-cyan-400 transition-colors"
                      >
                        {node.taxId}
                      </button>
                    </td>
                    <td className="py-2 px-3 text-center">{node.businessName || "—"}</td>
                    <td className="py-2 px-3 text-center">
                      <Badge variant="outline" className="text-xs">{node.source || "—"}</Badge>
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
          </div>
        )}
      </CardContent>
    </Card>
  )
}