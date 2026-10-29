import { ColumnFilter } from "@/components/ColumnFilter"
import { optionsFrom } from "@/lib/columnFilters"
import { formatDay, responsibleColor, splitLastAction } from "@/lib/crm"
import { responsiblePalette } from "@/lib/responsibleColors"
import { formatTaxId } from "@/lib/cuit"
import { cn } from "@/lib/utils"
import type { CrmAgendaItem, CrmResponsible } from "@/types"
import { DueDate } from "./DueDate"

const HEAD = "sticky z-10 bg-card text-left align-bottom py-1.5 px-2 font-medium"
const CELL = "py-1.5 px-2"

export function AgendaTable({
  tasks,
  rows,
  responsibles,
  hiddenCompanies,
  hiddenAssignees,
  onHiddenCompanies,
  onHiddenAssignees,
  stickyTop,
  emptyText,
  onOpen,
}: {
  tasks: CrmAgendaItem[]
  rows: CrmAgendaItem[]
  responsibles: CrmResponsible[]
  hiddenCompanies: string[]
  hiddenAssignees: string[]
  onHiddenCompanies: (hidden: string[]) => void
  onHiddenAssignees: (hidden: string[]) => void
  stickyTop: { top: number }
  emptyText: string
  onOpen: (task: CrmAgendaItem) => void
}) {
  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th style={stickyTop} className={cn(HEAD, "pl-0")}>
              <ColumnFilter
                label="Empresa"
                options={optionsFrom(tasks, (task) => [task.businessName])}
                hidden={hiddenCompanies}
                onChange={onHiddenCompanies}
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
                onChange={onHiddenAssignees}
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
              const color = responsibleColor(task.assignee, responsibles)
              const palette = responsiblePalette(color)
              const last = splitLastAction(task.lastAction)
              return (
              <tr
                key={task.id}
                data-testid={`agenda-${task.id}`}
                data-color={color}
                onClick={() => onOpen(task)}
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
  )
}
