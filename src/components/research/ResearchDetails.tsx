import { Badge } from "@/components/ui/badge"
import { ResearchSummary } from "@/components/research/ResearchSummary"
import type { WebResearch } from "@/types"

export function ResearchDetails({ research }: { research: WebResearch }) {
  if (research.status === "failed") return <Badge variant="destructive">La búsqueda falló</Badge>
  return (
    <>
      <ResearchSummary text={research.summary} />
      {research.sources.length > 0 && (
        <>
          <h4 className="text-sm font-semibold pt-2">Fuentes</h4>
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
        </>
      )}
    </>
  )
}
