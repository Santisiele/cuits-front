import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useNameSearch } from "@/hooks/useGraphQueries"

/** The backend rejects anything shorter, so the button stays disabled until here. */
const MIN_QUERY_LENGTH = 3

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
 * Most results are nodes outside the base — the ones the graph knows about
 * through enrichment — so each row says whether it is in the base and which
 * sources it came from.
 */
export function NameSearch({ onSelect }: NameSearchProps) {
  const [input, setInput] = useState("")
  const [submitted, setSubmitted] = useState("")

  const { data: results = [], isFetching, error } = useNameSearch(submitted, submitted.length > 0)

  const trimmed = input.trim()
  const canSearch = trimmed.length >= MIN_QUERY_LENGTH

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (!canSearch) return
    setSubmitted(trimmed)
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

        {error && (
          <p className="text-destructive text-sm">{(error as Error).message}</p>
        )}

        {submitted && !isFetching && !error && (
          <p className="text-xs text-muted-foreground">
            {results.length === 0
              ? `Sin resultados para "${submitted}"`
              : `${results.length} resultado${results.length > 1 ? "s" : ""} para "${submitted}"`}
          </p>
        )}

        {results.length > 0 && (
          <div className="divide-y divide-border overflow-auto" style={{ maxHeight: "22rem" }}>
            {results.map((node) => (
              <button
                key={node.taxId}
                onClick={() => onSelect(node.taxId)}
                className="w-full text-left py-2 px-1 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium break-words">
                    {node.businessName || "—"}
                  </span>
                  <span className="font-mono text-xs text-cyan-600 dark:text-cyan-400 shrink-0">
                    {node.taxId}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
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
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
