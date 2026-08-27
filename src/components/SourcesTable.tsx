import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Pencil, Trash2, GitMerge } from "lucide-react"
import { useSourcesQuery } from "@/hooks/useSourcesQuery"
import { RenameSourceDialog } from "./sources/RenameSourceDialog"
import { MergeSourcesDialog } from "./sources/MergeSourcesDialog"
import { DeleteSourceDialog } from "./sources/DeleteSourceDialog"
import type { SourceInfo, SourceCategory } from "@/types"

// ─── Constants ────────────────────────────────────────────────────────────────

type CategoryFilter = "all" | SourceCategory

const CATEGORY_FILTERS: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "known", label: "Conocidos" },
  { id: "toKnow", label: "Por conocer" },
]

const CATEGORY_LABELS: Record<SourceCategory, string> = {
  known: "Conocidos",
  toKnow: "Por conocer",
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * "Fuentes" tab. Lists every source with its category and node count, and
 * exposes the admin operations: rename and delete per source, merge across a
 * selection of exactly two.
 *
 * Merge is gated on both sources sharing a category — the backend rejects the
 * mix, so the button stays disabled and says why rather than letting the user
 * walk into a 409.
 */
export function SourcesTable() {
  const { data: sources = [], isLoading, error } = useSourcesQuery()

  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all")
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [renameTarget, setRenameTarget] = useState<SourceInfo | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SourceInfo | null>(null)
  const [mergeOpen, setMergeOpen] = useState(false)

  const filtered = sources
    .filter((source) => categoryFilter === "all" || source.category === categoryFilter)
    .filter((source) => source.name.toLowerCase().includes(search.trim().toLowerCase()))

  const selectedSources = sources.filter((source) => selected.has(source.name))
  const sameCategory =
    selectedSources.length === 2 &&
    selectedSources[0]!.category === selectedSources[1]!.category
  const canMerge = selectedSources.length === 2 && sameCategory

  function toggleSelected(name: string): void {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  function closeMerge(): void {
    setMergeOpen(false)
    setSelected(new Set())
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
          <CardTitle>Fuentes ({filtered.length})</CardTitle>
          <div className="flex gap-2 items-center flex-wrap">
            <Input
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Buscar fuente..."
              className="w-full sm:w-64"
            />
            <Button
              variant="outline"
              size="sm"
              disabled={!canMerge}
              onClick={() => setMergeOpen(true)}
            >
              <GitMerge className="w-4 h-4 mr-1" />
              Unificar seleccionadas
            </Button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap pt-2">
          {CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setCategoryFilter(filter.id)}
              className="focus:outline-none"
            >
              <Badge
                variant={categoryFilter === filter.id ? "default" : "outline"}
                className="cursor-pointer"
              >
                {filter.label}
              </Badge>
            </button>
          ))}
        </div>

        {selected.size > 0 && (
          <p className="text-xs text-muted-foreground pt-1">
            {selected.size} seleccionada{selected.size > 1 ? "s" : ""}
            {selected.size === 2 && !sameCategory && (
              <span className="text-destructive">
                {" "}
                · No se pueden unificar fuentes de distinta categoría
              </span>
            )}
            {selected.size > 2 && (
              <span className="text-destructive"> · Elegí exactamente 2 para unificar</span>
            )}
          </p>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Cargando fuentes...</p>
        ) : error ? (
          <p className="text-destructive text-sm">Error al cargar las fuentes</p>
        ) : (
          <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 300px)" }}>
            <table className="hidden sm:table w-full text-sm">
              <thead className="sticky top-0 bg-background">
                <tr>
                  <th className="w-10 py-2 px-3" />
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                    Nombre
                  </th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">
                    Categoría
                  </th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">
                    CUITs
                  </th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((source) => (
                  <tr key={source.name} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-2 px-3">
                      <Checkbox
                        checked={selected.has(source.name)}
                        onCheckedChange={() => toggleSelected(source.name)}
                        aria-label={`Seleccionar ${source.name}`}
                      />
                    </td>
                    <td className="py-2 px-3 font-medium">{source.name}</td>
                    <td className="py-2 px-3 text-center">
                      <Badge variant="outline">{CATEGORY_LABELS[source.category]}</Badge>
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-xs">
                      {source.nodeCount}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex gap-1 justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setRenameTarget(source)}
                          aria-label={`Renombrar ${source.name}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(source)}
                          aria-label={`Borrar ${source.name}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-muted-foreground">
                      No se encontraron fuentes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="sm:hidden divide-y divide-slate-800">
              {filtered.map((source) => (
                <div key={source.name} className="py-3 px-1">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selected.has(source.name)}
                      onCheckedChange={() => toggleSelected(source.name)}
                      className="mt-1"
                      aria-label={`Seleccionar ${source.name}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium break-words">{source.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {CATEGORY_LABELS[source.category]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {source.nodeCount} CUITs
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setRenameTarget(source)}
                        aria-label={`Renombrar ${source.name}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(source)}
                        aria-label={`Borrar ${source.name}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="py-4 text-center text-muted-foreground text-sm">
                  No se encontraron fuentes
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {renameTarget && (
        <RenameSourceDialog source={renameTarget} onClose={() => setRenameTarget(null)} />
      )}
      {deleteTarget && (
        <DeleteSourceDialog source={deleteTarget} onClose={() => setDeleteTarget(null)} />
      )}
      {mergeOpen && canMerge && (
        <MergeSourcesDialog
          sourceA={selectedSources[0]!}
          sourceB={selectedSources[1]!}
          onClose={closeMerge}
        />
      )}
    </Card>
  )
}
