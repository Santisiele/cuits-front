import { Badge } from "@/components/ui/badge"
import { formatDay } from "@/lib/crm"
import type { CrmAgendaItem } from "@/types"

export function DueDate({ task }: { task: CrmAgendaItem }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="whitespace-nowrap">{formatDay(task.dueDate)}</span>
      {task.overdue && <Badge variant="destructive">Vencida</Badge>}
    </span>
  )
}
