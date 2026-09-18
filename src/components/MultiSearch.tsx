import { useMemo, useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { GraphView } from "@/components/GraphView"
import { useCuitSearches } from "@/hooks/useGraphQueries"
import { parseCuitList, formatTaxId } from "@/lib/cuit"

const MAX_CUITS = 20

export function MultiSearch() {
  const [draft, setDraft] = useState("")
  const [depth, setDepth] = useState("3")
  const [search, setSearch] = useState<{ taxIds: string[]; maxDepth: number }>({
    taxIds: [],
    maxDepth: 3,
  })
  const [openTaxIds, setOpenTaxIds] = useState<Set<string>>(new Set())

  const parsed = useMemo(() => parseCuitList(draft), [draft])
  const queries = useCuitSearches(search.taxIds, search.maxDepth)

  const overflowed = parsed.taxIds.length - MAX_CUITS
  const searching = queries.some((query) => query.isFetching)
  const withTree = queries.filter((query) => query.data?.found).length

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault()
    const taxIds = parsed.taxIds.slice(0, MAX_CUITS)
    if (taxIds.length === 0) return
    setSearch({ taxIds, maxDepth: Number(depth) || 3 })
    setOpenTaxIds(taxIds.length === 1 ? new Set(taxIds) : new Set())
  }

  function toggle(taxId: string): void {
    setOpenTaxIds((current) => {
      const next = new Set(current)
      if (next.has(taxId)) next.delete(taxId)
      else next.add(taxId)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Buscar varios CUITs</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <Textarea
              value={draft}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value)}
              placeholder="Un CUIT por línea, o separados por coma"
              rows={5}
              disabled={searching}
            />
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <Input
                value={depth}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDepth(e.target.value)}
                placeholder="Profundidad"
                type="number"
                min={1}
                max={10}
                className="w-32"
                disabled={searching}
              />
              <Button type="submit" disabled={searching || parsed.taxIds.length === 0}>
                {searching ? "Buscando..." : "Buscar"}
              </Button>
              <p className="text-muted-foreground text-sm">
                {parsed.taxIds.length} CUIT{parsed.taxIds.length === 1 ? "" : "s"} para buscar
              </p>
            </div>

            {overflowed > 0 && (
              <p className="text-muted-foreground text-sm">
                Se buscan los primeros {MAX_CUITS}. Quedan {overflowed} afuera.
              </p>
            )}
            {parsed.rejected.length > 0 && (
              <p className="text-destructive text-sm">
                No son CUITs de 11 dígitos: {parsed.rejected.slice(0, 5).join(", ")}
                {parsed.rejected.length > 5 ? ` y ${parsed.rejected.length - 5} más` : ""}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {search.taxIds.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
          <p className="text-muted-foreground text-sm">
            {searching
              ? `Buscando ${search.taxIds.length} CUITs...`
              : `${withTree} de ${search.taxIds.length} con relaciones`}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenTaxIds(new Set(search.taxIds))}
            >
              Abrir todos
            </Button>
            <Button variant="outline" size="sm" onClick={() => setOpenTaxIds(new Set())}>
              Cerrar todos
            </Button>
          </div>
        </div>
      )}

      {search.taxIds.map((taxId, index) => {
        const query = queries[index]
        const result = query?.data
        const open = openTaxIds.has(taxId)
        const businessName = result?.results[0]?.data.businessName
        const error = query?.error ? (query.error as Error).message : null

        return (
          <Card key={taxId}>
            <CardHeader className="py-3">
              <button
                type="button"
                onClick={() => toggle(taxId)}
                className="flex items-center gap-2 text-left w-full"
              >
                {open ? (
                  <ChevronDown className="w-4 h-4 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 shrink-0" />
                )}
                <span className="font-medium">{formatTaxId(taxId)}</span>
                {businessName && (
                  <span className="text-muted-foreground truncate">{businessName}</span>
                )}
                <span className="ml-auto shrink-0">
                  {query?.isFetching ? (
                    <span className="text-muted-foreground text-sm">Buscando...</span>
                  ) : error ? (
                    <Badge variant="destructive">Error</Badge>
                  ) : result?.found ? (
                    <Badge variant="secondary">{result.results.length}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">Sin resultados</span>
                  )}
                </span>
              </button>
            </CardHeader>

            {open && (
              <CardContent>
                {error && <p className="text-destructive text-sm">{error}</p>}
                {!error && query?.isFetching && (
                  <p className="text-muted-foreground text-sm">Buscando {formatTaxId(taxId)}...</p>
                )}
                {!error && !query?.isFetching && result && <GraphView cuitResult={result} />}
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
