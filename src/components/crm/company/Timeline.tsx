import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useCrmMutations, useCrmResponsibles } from "@/hooks/useCrm"
import { useIsAdmin } from "@/hooks/useSessionRole"
import { useAuthStore } from "@/store/useAuthStore"
import { getErrorMessage } from "@/lib/errors"
import {
  TASK_STATUS_LABELS,
  buildTimeline,
  canChangeAction,
  cancelReasonLabel,
  formatDay,
  recordedForSomeoneElse,
  responsiblesOf,
} from "@/lib/crm"
import type { CrmAction, CrmTask } from "@/types"
import { ChangeHistory } from "../ChangeHistory"
import { undo } from "./undo"

export function Timeline({ actions, tasks, names }: { actions: CrmAction[]; tasks: CrmTask[]; names: Record<string, string> }) {
  const { archiveAction, restoreAction } = useCrmMutations()
  const me = useAuthStore((state) => state.username)
  const isAdmin = useIsAdmin()
  const responsibleList = useCrmResponsibles().data ?? []
  const mine = responsiblesOf(responsibleList, me)
  const entries = buildTimeline(actions, tasks)

  async function archive(action: CrmAction): Promise<void> {
    try {
      await archiveAction.mutateAsync(action.id)
      toast.success("Se archivó la acción", {
        action: { label: "Deshacer", onClick: () => void undo(() => restoreAction.mutateAsync(action.id)) },
      })
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Línea de tiempo</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no se registró nada.</p>
        ) : (
          <ol className="space-y-3">
            {entries.map((entry) =>
              entry.kind === "action" ? (
                <li key={entry.action.id} className="text-sm border-l-2 border-primary pl-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-muted-foreground">
                        {formatDay(entry.action.date)} · {entry.action.doneBy}
                        {recordedForSomeoneElse(entry.action, responsibleList) && ` (cargó ${entry.action.recordedBy})`}
                        {entry.action.contactIds.length > 0 && ` · con ${entry.action.contactIds.map((id) => names[id] ?? "?").join(", ")}`}
                      </p>
                      <p className="whitespace-pre-wrap break-words">{entry.action.description}</p>
                      {entry.fulfilled.map((task) => (
                        <p key={task.id} className="text-muted-foreground break-words">✓ Cumplió: {task.description}</p>
                      ))}
                      {entry.next && (
                        <p className="text-muted-foreground break-words">
                          → Próxima: {entry.next.description} · {entry.next.assignee} · vence {formatDay(entry.next.dueDate)}
                          {entry.next.status !== "open" && ` (${TASK_STATUS_LABELS[entry.next.status].toLowerCase()})`}
                        </p>
                      )}
                    </div>
                    {canChangeAction(me, isAdmin, entry.action, mine) && (
                      <Button size="sm" variant="ghost" aria-label="Archivar acción" disabled={archiveAction.isPending} onClick={() => void archive(entry.action)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <ChangeHistory entityType="Action" entityId={entry.action.id} names={names} />
                </li>
              ) : (
                <li key={entry.task.id} className="text-sm border-l-2 border-border pl-3">
                  <p className="text-muted-foreground">
                    {formatDay(entry.day)} · {entry.task.assignee} ·{" "}
                    <Badge variant={entry.task.status === "done" ? "secondary" : "outline"}>{TASK_STATUS_LABELS[entry.task.status]}</Badge>
                  </p>
                  <p className="break-words">{entry.task.description}</p>
                  {entry.task.cancelReason && <p className="text-muted-foreground">Motivo: {cancelReasonLabel(entry.task.cancelReason)}</p>}
                  <ChangeHistory entityType="Task" entityId={entry.task.id} names={names} />
                </li>
              )
            )}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
