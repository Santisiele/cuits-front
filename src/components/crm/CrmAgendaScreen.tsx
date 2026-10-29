import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ColumnFilter } from "@/components/ColumnFilter"
import { useCrmAgenda, useCrmUsers } from "@/hooks/useCrm"
import { getErrorMessage } from "@/lib/errors"
import { optionsFrom, passesFilter } from "@/lib/columnFilters"
import { formatDay } from "@/lib/crm"
import { formatTaxId } from "@/lib/cuit"
import { cn } from "@/lib/utils"
import { CheckRow, NativeSelect } from "./CrmFields"

export function CrmAgendaScreen() {
  const [assignee, setAssignee] = useState("me")
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [hiddenAssignees, setHiddenAssignees] = useState<string[]>([])
  const [hiddenCompanies, setHiddenCompanies] = useState<string[]>([])
  const agenda = useCrmAgenda(assignee)
  const users = useCrmUsers()
  const navigate = useNavigate()

  const tasks = agenda.data ?? []
  const rows = tasks.filter(
    (task) =>
      (!overdueOnly || task.overdue) &&
      passesFilter([task.assignee], new Set(hiddenAssignees)) &&
      passesFilter([task.businessName], new Set(hiddenCompanies))
  )
  const overdueCount = tasks.filter((task) => task.overdue).length

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <CardTitle>Agenda</CardTitle>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <NativeSelect aria-label="Responsable" value={assignee} onChange={(e) => setAssignee(e.target.value)} className="sm:w-48">
              <option value="me">Mis tareas</option>
              <option value="all">Todos</option>
              {(users.data ?? []).map((user) => (
                <option key={user} value={user}>{user}</option>
              ))}
            </NativeSelect>
            <CheckRow checked={overdueOnly} onChange={setOverdueOnly}>
              Solo vencidas{overdueCount > 0 && ` (${overdueCount})`}
            </CheckRow>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {agenda.isLoading ? (
          <p className="text-muted-foreground text-sm">Cargando...</p>
        ) : agenda.error ? (
          <p className="text-destructive text-sm">{getErrorMessage(agenda.error, "Error al cargar la agenda")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-1.5 pr-3 font-medium">Vence</th>
                  <th className="text-left py-1.5 px-3 font-medium">Tarea</th>
                  <th className="text-left py-1.5 px-3 font-medium">
                    <ColumnFilter
                      label="Empresa"
                      options={optionsFrom(tasks, (task) => [task.businessName])}
                      hidden={hiddenCompanies}
                      onChange={setHiddenCompanies}
                    />
                  </th>
                  <th className="text-left py-1.5 pl-3 font-medium">
                    <ColumnFilter
                      label="Responsable"
                      options={optionsFrom(tasks, (task) => [task.assignee])}
                      hidden={hiddenAssignees}
                      onChange={setHiddenAssignees}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-3 text-muted-foreground">No hay tareas abiertas.</td>
                  </tr>
                ) : (
                  rows.map((task) => (
                    <tr
                      key={task.id}
                      data-testid={`agenda-${task.id}`}
                      onClick={() => void navigate(`/crm/${task.companyTaxId}`)}
                      className="border-b border-border last:border-0 cursor-pointer hover:bg-accent/50 transition-colors"
                    >
                      <td className={cn("py-1.5 pr-3 whitespace-nowrap", task.overdue && "text-destructive font-medium")}>
                        {formatDay(task.dueDate)}
                        {task.overdue && <Badge variant="destructive" className="ml-2">Vencida</Badge>}
                      </td>
                      <td className="py-1.5 px-3 break-words">{task.description}</td>
                      <td className="py-1.5 px-3">
                        <div>{task.businessName || "—"}</div>
                        <div className="text-xs text-muted-foreground font-mono">{formatTaxId(task.companyTaxId)}</div>
                      </td>
                      <td className="py-1.5 pl-3">{task.assignee}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
