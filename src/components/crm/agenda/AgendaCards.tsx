import { formatDay, responsibleColor, splitLastAction } from "@/lib/crm"
import { responsiblePalette } from "@/lib/responsibleColors"
import { formatTaxId } from "@/lib/cuit"
import { cn } from "@/lib/utils"
import type { CrmAgendaItem, CrmResponsible } from "@/types"
import { DueDate } from "./DueDate"

export function AgendaCards({
  tasks,
  responsibles,
  emptyText,
  onOpen,
}: {
  tasks: CrmAgendaItem[]
  responsibles: CrmResponsible[]
  emptyText: string
  onOpen: (task: CrmAgendaItem) => void
}) {
  if (tasks.length === 0) return <p className="py-3 text-sm text-muted-foreground">{emptyText}</p>
  return (
    <ul className="flex flex-col gap-2">
      {tasks.map((task) => {
        const color = responsibleColor(task.assignee, responsibles)
        const palette = responsiblePalette(color)
        const last = splitLastAction(task.lastAction)
        return (
          <li key={task.id} data-testid={`agenda-${task.id}`} data-color={color}>
            <button type="button" onClick={() => onOpen(task)} className={cn("w-full text-left border border-border p-3 text-sm flex flex-col gap-2", palette.row)}>
              <span>
                <span className="block font-medium">{task.businessName || "—"}</span>
                <span className="block text-xs text-muted-foreground font-mono">{formatTaxId(task.companyTaxId)}</span>
              </span>
              <span className={cn("flex flex-col gap-1 px-2 py-1.5", palette.badge)}>
                <span className="flex flex-wrap items-center justify-between gap-2 font-medium">
                  <DueDate task={task} />
                  <span>{task.assignee}</span>
                </span>
                <span className="break-words">{task.description}</span>
              </span>
              {task.lastAction && (
                <span className="text-xs text-muted-foreground break-words">
                  {formatDay(task.lastAction.date)} · {task.lastAction.doneBy}
                  {last.withWhom && ` con ${last.withWhom}`}: {last.what}
                </span>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
