import { useState } from "react"
import { ChevronDown, ChevronRight, Globe, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useResearchHistory, useRunResearch } from "@/hooks/useResearch"
import { formatIsoDateTime } from "@/lib/dates"
import { getErrorMessage } from "@/lib/errors"
import { formatUsd, researchButtonLabel, researchCuit } from "@/lib/research"
import type { WebResearch } from "@/types"

function ResearchResult({ research }: { research: WebResearch }) {
  return (
    <div className="space-y-2" data-testid={`research-${research.id}`}>
      <p className="text-xs text-muted-foreground">
        {formatIsoDateTime(research.requestedAt)} · pedida por {research.requestedBy} · {formatUsd(research.costUsd)}
      </p>
      {research.status === "failed" ? (
        <Badge variant="destructive">La búsqueda falló</Badge>
      ) : (
        <>
          <p className="text-sm whitespace-pre-line">{research.summary}</p>
          {research.sources.length > 0 && (
            <ul className="space-y-1 text-sm list-disc pl-5">
              {research.sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-600 dark:text-cyan-400 hover:underline break-all"
                  >
                    {source.title || source.url}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

export function WebResearchSection({ taxId }: { taxId: string }) {
  const cuit = researchCuit(taxId)
  const { data: history = [], isLoading, error } = useResearchHistory(cuit)
  const run = useRunResearch(cuit)
  const [showEarlier, setShowEarlier] = useState(false)

  const [latest, ...earlier] = history

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
          <CardTitle>Investigación web</CardTitle>
          <Button size="sm" onClick={() => run.mutate()} disabled={run.isPending || isLoading}>
            {run.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Globe className="w-4 h-4 mr-1" />}
            {run.isPending ? "Buscando..." : researchButtonLabel(history.length)}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {run.isPending && (
          <p className="text-muted-foreground text-sm">Esto puede tardar hasta un par de minutos</p>
        )}
        {run.isError && <p className="text-destructive text-sm">{getErrorMessage(run.error)}</p>}

        {isLoading ? (
          <p className="text-muted-foreground text-sm">Cargando...</p>
        ) : error ? (
          <p className="text-destructive text-sm">{getErrorMessage(error)}</p>
        ) : !latest ? (
          !run.isPending && <p className="text-muted-foreground text-sm">Todavía no se buscó este CUIT en la web.</p>
        ) : (
          <ResearchResult research={latest} />
        )}

        {earlier.length > 0 && (
          <div className="space-y-3">
            <Button variant="ghost" size="sm" onClick={() => setShowEarlier((open) => !open)}>
              {showEarlier ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
              Búsquedas anteriores ({earlier.length})
            </Button>
            {showEarlier && (
              <div className="space-y-4 border-l border-border pl-4">
                {earlier.map((research) => (
                  <ResearchResult key={research.id} research={research} />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
