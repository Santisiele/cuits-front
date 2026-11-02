import { useState } from "react"
import { Pencil, Plus, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCrmResponsibles } from "@/hooks/useCrm"
import { useIsAdmin } from "@/hooks/useSessionRole"
import { useAuthStore } from "@/store/useAuthStore"
import { canChangeTask, formatDay, isOverdue, responsiblesOf, todayInBuenosAires } from "@/lib/crm"
import { cn } from "@/lib/utils"
import type { CrmContact, CrmTask } from "@/types"
import { CancelTaskDialog } from "../CancelTaskDialog"
import { ChangeHistory } from "../ChangeHistory"
import { TaskDialog } from "../TaskDialog"

export function OpenTasks({
  taxId,
  tasks,
  contacts,
  names,
  closed,
}: {
  taxId: string
  tasks: CrmTask[]
  contacts: CrmContact[]
  names: Record<string, string>
  closed: boolean
}) {
  const me = useAuthStore((state) => state.username)
  const isAdmin = useIsAdmin()
  const mine = responsiblesOf(useCrmResponsibles().data ?? [], me)
  const [editing, setEditing] = useState<CrmTask | "new" | null>(null)
  const [cancelling, setCancelling] = useState<CrmTask | null>(null)
  const today = todayInBuenosAires()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Tareas abiertas</CardTitle>
          {!closed && (
            <Button size="sm" variant="outline" onClick={() => setEditing("new")}>
              <Plus className="w-4 h-4 mr-1" />
              Tarea
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay tareas abiertas.</p>
        ) : (
          <div className="divide-y divide-border">
            {tasks.map((task) => {
              const allowed = canChangeTask(me, isAdmin, task, mine)
              const overdue = isOverdue(task.dueDate, today)
              return (
                <div key={task.id} data-testid={`task-${task.id}`} className="py-2 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="text-sm space-y-0.5 min-w-0">
                    <p className="font-medium break-words">{task.description}</p>
                    <p className="text-muted-foreground">
                      <span className={cn(overdue && "text-destructive font-medium")}>Vence {formatDay(task.dueDate)}</span>
                      {overdue && " · vencida"} · {task.assignee}
                      {task.contactIds.length > 0 && ` · con ${task.contactIds.map((id) => names[id] ?? "?").join(", ")}`}
                    </p>
                    <ChangeHistory entityType="Task" entityId={task.id} names={names} />
                  </div>
                  {allowed && (
                    <div className="flex gap-2 shrink-0 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => setCancelling(task)}>
                        <X className="w-4 h-4 mr-1" />
                        Cancelar
                      </Button>
                      <Button size="sm" variant="ghost" aria-label="Editar tarea" onClick={() => setEditing(task)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
      {editing && <TaskDialog companyTaxId={taxId} task={editing === "new" ? null : editing} contacts={contacts} onClose={() => setEditing(null)} />}
      {cancelling && <CancelTaskDialog task={cancelling} onClose={() => setCancelling(null)} />}
    </Card>
  )
}
