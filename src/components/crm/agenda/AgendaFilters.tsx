import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AgendaWhen } from "@/lib/crm"
import type { CrmResponsible } from "@/types"
import { NativeSelect } from "../CrmFields"

export function AgendaFilters({
  assignee,
  onAssignee,
  when,
  onWhen,
  responsibles,
  overdueCount,
  upcomingCount,
  onAdd,
}: {
  assignee: string
  onAssignee: (assignee: string) => void
  when: AgendaWhen
  onWhen: (when: AgendaWhen) => void
  responsibles: CrmResponsible[]
  overdueCount: number
  upcomingCount: number
  onAdd: () => void
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <Button size="sm" onClick={onAdd}>
        <Plus className="w-4 h-4 mr-1" />
        Nueva tarea
      </Button>
      <NativeSelect aria-label="Responsable" value={assignee} onChange={(e) => onAssignee(e.target.value)} className="sm:w-48">
        <option value="me">Mis tareas</option>
        <option value="all">Todos</option>
        {responsibles.filter((responsible) => !responsible.disabled).map((responsible) => (
          <option key={responsible.name} value={responsible.name}>{responsible.name}</option>
        ))}
      </NativeSelect>
      <div className="flex" role="group" aria-label="Vencimiento">
        {(["all", "overdue", "upcoming"] as const).map((option) => (
          <Button
            key={option}
            size="sm"
            variant={when === option ? "default" : "outline"}
            aria-pressed={when === option}
            onClick={() => onWhen(option)}
            className="-ml-px first:ml-0"
          >
            {option === "all" ? "Todas" : option === "overdue" ? `Vencidas (${overdueCount})` : `Próximas (${upcomingCount})`}
          </Button>
        ))}
      </div>
    </div>
  )
}
