import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ColumnFilter } from "@/components/ColumnFilter"
import { useCrmAgenda, useCrmUsers } from "@/hooks/useCrm"
import { getErrorMessage } from "@/lib/errors"
import { optionsFrom, passesFilter } from "@/lib/columnFilters"
import { formatDay, userColor } from "@/lib/crm"
import { paletteFor } from "@/lib/trustLevels"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AgendaTaskDialog } from "./AgendaTaskDialog"
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

  const [adding, setAdding] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const [headerHeight, setHeaderHeight] = useState(0)
  const stickyTop = { top: headerHeight }
  const userList = users.data ?? []

  useEffect(() => {
    const header = headerRef.current
    if (!header || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(() => setHeaderHeight(header.offsetHeight))
    observer.observe(header)
    setHeaderHeight(header.offsetHeight)
    return () => observer.disconnect()
  }, [])
  const tasks = agenda.data ?? []
  const rows = tasks.filter(
    (task) =>
      (!overdueOnly || task.overdue) &&
      passesFilter([task.assignee], new Set(hiddenAssignees)) &&
      passesFilter([task.businessName], new Set(hiddenCompanies))
  )
  const overdueCount = tasks.filter((task) => task.overdue).length

  return (
    <Card className="overflow-visible pt-0">
      <CardHeader ref={headerRef} data-testid="crm-agenda-header" className="sticky top-0 z-20 bg-card pt-4 pb-3 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <CardTitle>Agenda</CardTitle>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Nueva tarea
            </Button>
            <NativeSelect aria-label="Responsable" value={assignee} onChange={(e) => setAssignee(e.target.value)} className="sm:w-48">
              <option value="me">Mis tareas</option>
              <option value="all">Todos</option>
              {userList.map((user) => (
                <option key={user.username} value={user.username}>{user.username}</option>
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
          <div className="overflow-x-auto md:overflow-visible">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th style={stickyTop} className="sticky z-10 bg-card text-left py-1.5 pr-3 font-medium">Vence</th>
                  <th style={stickyTop} className="sticky z-10 bg-card text-left py-1.5 px-3 font-medium">Tarea</th>
                  <th style={stickyTop} className="sticky z-10 bg-card text-left py-1.5 px-3 font-medium">
                    <ColumnFilter
                      label="Empresa"
                      options={optionsFrom(tasks, (task) => [task.businessName])}
                      hidden={hiddenCompanies}
                      onChange={setHiddenCompanies}
                    />
                  </th>
                  <th style={stickyTop} className="sticky z-10 bg-card text-left py-1.5 pl-3 font-medium">
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
                  rows.map((task) => {
                    const palette = paletteFor(userColor(task.assignee, userList))
                    return (
                    <tr
                      key={task.id}
                      data-testid={`agenda-${task.id}`}
                      data-color={userColor(task.assignee, userList)}
                      onClick={() => void navigate(`/crm/${task.companyTaxId}`, { state: { from: "agenda" } })}
                      className={cn("border-b border-border last:border-0 cursor-pointer transition-colors", palette.row)}
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
                      <td className="py-1.5 pl-3">
                        <span className={cn("inline-flex items-center gap-1.5 px-1.5 py-0.5 text-xs font-medium", palette.badge)}>
                          <span className={cn("h-2 w-2 shrink-0", palette.swatch)} />
                          {task.assignee}
                        </span>
                      </td>
                    </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
      {adding && <AgendaTaskDialog onClose={() => setAdding(false)} />}
    </Card>
  )
}
