import { Loader2 } from "lucide-react"
import { ResearchSummary } from "@/components/research/ResearchSummary"
import { ChatTableView } from "@/components/ai-chat/ChatTableView"
import { answerNote } from "@/lib/aiChat"
import { formatUsd } from "@/lib/research"
import { cn } from "@/lib/utils"
import type { AiChatMessage } from "@/types"

export function ChatMessageView({ message }: { message: AiChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] bg-primary text-primary-foreground px-3 py-2 text-sm whitespace-pre-wrap break-words">
          {message.text}
        </p>
      </div>
    )
  }

  if (message.status === "running") {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Pensando… Podés salir de la pantalla, la respuesta sigue.
      </p>
    )
  }

  const note = answerNote(message)
  return (
    <div className="space-y-3">
      {message.text.trim() !== "" && <ResearchSummary text={message.text} />}
      {message.tables.map((table) => (
        <ChatTableView key={table.resultId} table={table} />
      ))}
      {message.sources.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Fuentes</p>
          <ul className="text-xs space-y-0.5">
            {message.sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-600 dark:text-cyan-400 hover:underline break-all"
                >
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {note && <p className={cn("text-sm", message.status === "failed" ? "text-destructive" : "text-amber-600 dark:text-amber-400")}>{note}</p>}
      <p className="text-xs text-muted-foreground">Costo: {formatUsd(message.costUsd)}</p>
    </div>
  )
}
