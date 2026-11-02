import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCrmAgenda, useCrmResponsibles } from "@/hooks/useCrm"
import { useElementHeight } from "@/hooks/useElementHeight"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { getErrorMessage } from "@/lib/errors"
import { filterAgenda, type AgendaWhen } from "@/lib/crm"
import type { CrmAgendaItem } from "@/types"
import { AgendaTaskDialog } from "./AgendaTaskDialog"
import { AgendaCards } from "./agenda/AgendaCards"
import { AgendaFilters } from "./agenda/AgendaFilters"
import { AgendaTable } from "./agenda/AgendaTable"

export function CrmAgendaScreen() {
  const [assignee, setAssignee] = useState("all")
  const [when, setWhen] = useState<AgendaWhen>("all")
  const [hiddenAssignees, setHiddenAssignees] = useState<string[]>([])
  const [hiddenCompanies, setHiddenCompanies] = useState<string[]>([])
  const [adding, setAdding] = useState(false)
  const agenda = useCrmAgenda(assignee)
  const responsibles = useCrmResponsibles().data ?? []
  const navigate = useNavigate()
  const phone = useMediaQuery("(max-width: 1023px)")
  const headerRef = useRef<HTMLDivElement>(null)
  const stickyTop = { top: useElementHeight(headerRef) }

  const tasks = agenda.data ?? []
  const rows = filterAgenda(tasks, when, hiddenAssignees, hiddenCompanies)
  const overdueCount = tasks.filter((task) => task.overdue).length
  const emptyText = tasks.length === 0 ? "No hay tareas abiertas." : "Ninguna tarea coincide con los filtros."
  const open = (task: CrmAgendaItem) => void navigate(`/crm/${task.companyTaxId}`, { state: { from: "agenda" } })

  return (
    <Card className="overflow-visible pt-0">
      <CardHeader ref={headerRef} data-testid="crm-agenda-header" className="sticky top-0 z-20 bg-card pt-4 pb-3 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <CardTitle>Agenda</CardTitle>
          <AgendaFilters
            assignee={assignee}
            onAssignee={setAssignee}
            when={when}
            onWhen={setWhen}
            responsibles={responsibles}
            overdueCount={overdueCount}
            upcomingCount={tasks.length - overdueCount}
            onAdd={() => setAdding(true)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {agenda.isLoading ? (
          <p className="text-muted-foreground text-sm">Cargando...</p>
        ) : agenda.error ? (
          <p className="text-destructive text-sm">{getErrorMessage(agenda.error, "Error al cargar la agenda")}</p>
        ) : phone ? (
          <AgendaCards tasks={rows} responsibles={responsibles} emptyText={emptyText} onOpen={open} />
        ) : (
          <AgendaTable
            tasks={tasks}
            rows={rows}
            responsibles={responsibles}
            hiddenCompanies={hiddenCompanies}
            hiddenAssignees={hiddenAssignees}
            onHiddenCompanies={setHiddenCompanies}
            onHiddenAssignees={setHiddenAssignees}
            stickyTop={stickyTop}
            emptyText={emptyText}
            onOpen={open}
          />
        )}
      </CardContent>
      {adding && <AgendaTaskDialog onClose={() => setAdding(false)} />}
    </Card>
  )
}
