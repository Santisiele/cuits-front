import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ColumnFilter } from "@/components/ColumnFilter"
import { useCrmAgenda, useCrmResponsibles } from "@/hooks/useCrm"
import { getErrorMessage } from "@/lib/errors"
import { optionsFrom, passesFilter } from "@/lib/columnFilters"
import { formatDay, responsibleColor, splitLastAction } from "@/lib/crm"
import { responsiblePalette } from "@/lib/responsibleColors"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AgendaTaskDialog } from "./AgendaTaskDialog"
import { formatTaxId } from "@/lib/cuit"
import { cn } from "@/lib/utils"
import { NativeSelect } from "./CrmFields"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import type { CrmAgendaItem, CrmResponsible } from "@/types"

const HEAD = "sticky z-10 bg-card text-left align-bottom py-1.5 px-2 font-medium"
const CELL = "py-1.5 px-2"

export function CrmAgendaScreen() {
  const [assignee, setAssignee] = useState("all")
  const [when, setWhen] = useState<"all" | "overdue" | "upcoming">("all")
  const [hiddenAssignees, setHiddenAssignees] = useState<string[]>([])
  const [hiddenCompanies, setHiddenCompanies] = useState<string[]>([])
  const agenda = useCrmAgenda(assignee)
  const responsibles = useCrmResponsibles()
  const navigate = useNavigate()
  const phone = useMediaQuery("(max-width: 1023px)")
  const open = (task: CrmAgendaItem) => void navigate(`/crm/${task.companyTaxId}`, { state: { from: "agenda" } })

  const [adding, setAdding] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const [headerHeight, setHeaderHeight] = useState(0)
  const stickyTop = { top: headerHeight }
  const responsibleList = responsibles.data ?? []

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
      (when === "all" || (when === "overdue") === task.overdue) &&
      passesFilter([task.assignee], new Set(hiddenAssignees)) &&
      passesFilter([task.businessName], new Set(hiddenCompanies))
  )
  const overdueCount = tasks.filter((task) => task.overdue).length
  const emptyText = tasks.length === 0 ? "No hay tareas abiertas." : "Ninguna tarea coincide con los filtros."

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
              {responsibleList.filter((responsible) => !responsible.disabled).map((responsible) => (
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
                  onClick={() => setWhen(option)}
                  className="-ml-px first:ml-0"
                >
                  {option === "all" ? "Todas" : option === "overdue" ? `Vencidas (${overdueCount})` : `Próximas (${tasks.length - overdueCount})`}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {agenda.isLoading ? (
          <p className="text-muted-foreground text-sm">Cargando...</p>
        ) : agenda.error ? (
          <p className="text-destructive text-sm">{getErrorMessage(agenda.error, "Error al cargar la agenda")}</p>
        ) : phone ? (
          <AgendaCards tasks={rows} responsibles={responsibleList} emptyText={emptyText} onOpen={open} />
        ) : (
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th style={stickyTop} className={cn(HEAD, "pl-0")}>
                    <ColumnFilter
                      label="Empresa"
                      options={optionsFrom(tasks, (task) => [task.businessName])}
                      hidden={hiddenCompanies}
                      onChange={setHiddenCompanies}
                    />
                  </th>
                  <th style={stickyTop} className={HEAD}>Con quién?</th>
                  <th style={stickyTop} className={HEAD}>Fecha última acción</th>
                  <th style={stickyTop} className={HEAD}>Qué se hizo?</th>
                  <th style={stickyTop} className={HEAD}>Quién lo hizo?</th>
                  <th style={stickyTop} className={HEAD}>Fecha próxima acción</th>
                  <th style={stickyTop} className={HEAD}>Qué hacer?</th>
                  <th style={stickyTop} className={cn(HEAD, "pr-0")}>
                    <ColumnFilter
                      label="Quién lo hará"
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
                    <td colSpan={8} className="py-3 text-muted-foreground">{emptyText}</td>
                  </tr>
                ) : (
                  rows.map((task) => {
                    const color = responsibleColor(task.assignee, responsibleList)
                    const palette = responsiblePalette(color)
                    const last = splitLastAction(task.lastAction)
                    return (
                    <tr
                      key={task.id}
                      data-testid={`agenda-${task.id}`}
                      data-color={color}
                      onClick={() => open(task)}
                      className={cn("border-b border-border last:border-0 cursor-pointer transition-colors align-top", palette.row)}
                    >
                      <td className={cn(CELL, "pl-0")}>
                        <div className="font-medium">{task.businessName || "—"}</div>
                        <div className="text-xs text-muted-foreground font-mono">{formatTaxId(task.companyTaxId)}</div>
                      </td>
                      <td className={CELL}>{last.withWhom || "—"}</td>
                      <td className={cn(CELL, "whitespace-nowrap")}>{formatDay(task.lastAction?.date ?? null)}</td>
                      <td className={cn(CELL, "break-words")}>{last.what || "—"}</td>
                      <td className={CELL}>{task.lastAction?.doneBy || "—"}</td>
                      <td className={cn(CELL, "font-medium", palette.badge)}>
                        <DueDate task={task} />
                      </td>
                      <td className={cn(CELL, "break-words")}>{task.description}</td>
                      <td className={cn(CELL, "pr-0")}>
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

function DueDate({ task }: { task: CrmAgendaItem }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="whitespace-nowrap">{formatDay(task.dueDate)}</span>
      {task.overdue && <Badge variant="destructive">Vencida</Badge>}
    </span>
  )
}

function AgendaCards({
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
