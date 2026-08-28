import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useNameSearch } from "@/hooks/useGraphQueries"
import type { NameSearchResult } from "@/types"

// ─── Constants ────────────────────────────────────────────────────────────────

/** The backend rejects anything shorter, so the button stays disabled until here. */
const MIN_QUERY_LENGTH = 3

type BaseFilter = "all" | "inBase" | "outside"

const BASE_FILTERS: { id: BaseFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "inBase", label: "En mi base" },
  { id: "outside", label: "Externos" },
]

// ─── Component ────────────────────────────────────────────────────────────────

interface NameSearchProps {
  /**
   * Runs the regular CUIT search for the clicked result. Receives the exact
   * taxId, which is the whole point of this section: you arrive knowing a
   * name and leave with the search you actually wanted.
   */
  onSelect: (taxId: string) => void
}

/**
 * Searches nodes by business name and lists the matches.
 *
 * The search is submitted rather than run while typing: it scans every node in
 * the graph, so firing it per keystroke would be wasteful for no gain.
 *
 * Filtering happens over the results already fetched — by source tag and by
 * whether the node is in the base — so narrowing a result set never costs
 * another round trip.
 */
export function NameSearch({ onSelect }: NameSearchProps) {
  const [input, setInput] = useState("")
  const [submitted, setSubmitted] = useState("")
  const [baseFilter, setBaseFilter] = useState<BaseFilter>("all")
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set())

  const { data: results = [], isFetching, error } = useNameSearch(submitted, submitted.length > 0)

  const trimmed = input.trim()
  const canSearch = trimmed.length >= MIN_QUERY_LENGTH

  /** Every source present in the current results, for the tag filter. */
  const availableSources = useMemo(
    () => [...new Set(results.flatMap((node) => node.sources))].sort(),
    [results]
  )

  const filtered = useMemo(
    () =>
      results
        .filter((node) => {
          if (baseFilter === "inBase") return node.inMyBase
          if (baseFilter === "outside") return !node.inMyBase
          return true
        })
        .filter(
          (node) =>
            selectedSources.size === 0 ||
            node.sources.some((source) => selectedSources.has(source))
        ),
    [results, baseFilter, selectedSources]
  )

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (!canSearch) return
    setSubmitted(trimmed)
    setBaseFilter("all")
    setSelectedSources(new Set())
  }

  function toggleSource(source: string): void {
    setSelectedSources((current) => {
      const next = new Set(current)
      if (next.has(source)) next.delete(source)
      else next.add(source)
      return next
    })
  }

  const counts = {
    inBase: results.filter((node) => node.inMyBase).length,
    outside: results.filter((node) => !node.inMyBase).length,
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buscar por nombre</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <Input
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            placeholder="Nombre o parte del nombre"
            className="flex-1"
          />
          <Button type="submit" disabled={!canSearch || isFetching}>
            {isFetching ? "Buscando..." : "Buscar"}
          </Button>
        </form>

        {trimmed.length > 0 && !canSearch && (
          <p className="text-xs text-muted-foreground">
            Escribí al menos {MIN_QUERY_LENGTH} caracteres.
          </p>
        )}

        {error && <p className="text-destructive text-sm">{(error as Error).message}</p>}

        {submitted && !isFetching && !error && results.length === 0 && (
          <p className="text-xs text-muted-foreground">Sin resultados para "{submitted}"</p>
        )}

        {results.length > 0 && (
          <>
            <div className="flex gap-2 flex-wrap">
              {BASE_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setBaseFilter(filter.id)}
                  className="focus:outline-none"
                >
                  <Badge
                    variant={baseFilter === filter.id ? "default" : "outline"}
                    className="cursor-pointer"
                  >
                    {filter.label}
                    {filter.id === "inBase" && ` (${counts.inBase})`}
                    {filter.id === "outside" && ` (${counts.outside})`}
                    {filter.id === "all" && ` (${results.length})`}
                  </Badge>
                </button>
              ))}
            </div>

            {availableSources.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {availableSources.map((source) => (
                  <button
                    key={source}
                    onClick={() => toggleSource(source)}
                    className="focus:outline-none"
                  >
                    <Badge
                      variant={selectedSources.has(source) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                    >
                      {source}
                    </Badge>
                  </button>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Mostrando {filtered.length} de {results.length} resultado
              {results.length > 1 ? "s" : ""} para "{submitted}"
            </p>

            <div className="divide-y divide-border overflow-auto" style={{ maxHeight: "22rem" }}>
              {filtered.map((node) => (
                <ResultRow key={node.taxId} node={node} onSelect={onSelect} />
              ))}
              {filtered.length === 0 && (
                <p className="py-4 text-center text-muted-foreground text-sm">
                  Ningún resultado pasa los filtros
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Row ──────────────────────────────────────────────────────────────────────

interface ResultRowProps {
  node: NameSearchResult
  onSelect: (taxId: string) => void
}

/**
 * One result. The whole strip is the click target — a row where only the name
 * responds reads as broken, and the useful gesture is "pick this one", not
 * "click these particular words".
 */
function ResultRow({ node, onSelect }: ResultRowProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(node.taxId)}
      className="block w-full cursor-pointer px-2 py-3 text-left transition-colors hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium break-words">{node.businessName || "—"}</span>
        <span className="font-mono text-xs text-cyan-600 dark:text-cyan-400 shrink-0">
          {node.taxId}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <Badge variant={node.inMyBase ? "default" : "secondary"} className="text-xs">
          {node.inMyBase ? "En mi base" : "Externo"}
        </Badge>
        {node.sources.map((source) => (
          <Badge key={source} variant="outline" className="text-xs">
            {source}
          </Badge>
        ))}
        <span className="text-xs text-muted-foreground">
          {node.relationshipCount} relaciones
        </span>
      </div>
    </button>
  )
}
