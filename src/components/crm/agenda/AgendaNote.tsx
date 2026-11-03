import { Info } from "lucide-react"
import { agendaNote } from "@/lib/crm"
import type { CrmAgendaItem } from "@/types"

export function AgendaNote({ task }: { task: CrmAgendaItem }) {
  const note = agendaNote(task)
  if (!note) return null
  return (
    <span className="mt-1 flex items-start gap-1 text-xs font-normal text-muted-foreground" data-testid={`agenda-note-${task.id}`}>
      <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
      {note}
    </span>
  )
}
