import { useState } from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCrmMutations } from "@/hooks/useCrm"
import { useAuthStore } from "@/store/useAuthStore"
import { getErrorMessage } from "@/lib/errors"
import {
  DESCRIPTION_REQUIRED,
  dateError,
  formatDay,
  hasErrors,
  requiredTextError,
  taskDraftErrors,
  todayInBuenosAires,
  type TaskDraft,
} from "@/lib/crm"
import type { CrmContact, CrmTask } from "@/types"
import { CheckRow, DialogButtons, Field } from "./CrmFields"
import { TaskFields } from "./TaskFields"

export function RecordActionDialog({
  companyTaxId,
  contacts,
  openTasks,
  onClose,
}: {
  companyTaxId: string
  contacts: CrmContact[]
  openTasks: CrmTask[]
  onClose: () => void
}) {
  const { recordAction } = useCrmMutations()
  const me = useAuthStore((state) => state.username) ?? ""
  const [date, setDate] = useState(() => todayInBuenosAires())
  const [description, setDescription] = useState("")
  const [contactIds, setContactIds] = useState<string[]>([])
  const [completesTaskIds, setCompletesTaskIds] = useState<string[]>(() => openTasks.map((task) => task.id))
  const [nextTask, setNextTask] = useState<TaskDraft>({ description: "", dueDate: "", assignee: me, contactIds: [] })
  const [error, setError] = useState("")

  const errors = {
    date: dateError(date),
    description: requiredTextError(description, DESCRIPTION_REQUIRED),
  }
  const nextTaskErrors = taskDraftErrors(nextTask)
  const canSubmit = !hasErrors(errors) && !hasErrors(nextTaskErrors)

  function toggle(list: string[], id: string, checked: boolean): string[] {
    return checked ? [...list, id] : list.filter((other) => other !== id)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    if (!canSubmit) return
    setError("")
    try {
      await recordAction.mutateAsync({
        companyTaxId,
        date,
        description: description.trim(),
        contactIds,
        completesTaskIds,
        nextTask: {
          description: nextTask.description.trim(),
          dueDate: nextTask.dueDate,
          assignee: nextTask.assignee || null,
          contactIds: nextTask.contactIds,
        },
      })
      toast.success("Se registró la acción")
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar acción</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <Field id="crm-action-date" label="Fecha" error={errors.date}>
            <Input id="crm-action-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field id="crm-action-description" label="Qué se hizo" error={description ? errors.description : null}>
            <Textarea id="crm-action-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} autoFocus />
          </Field>

          {contacts.length > 0 && (
            <fieldset className="space-y-1.5">
              <legend className="text-sm font-medium">Con quién</legend>
              {contacts.map((contact) => (
                <CheckRow
                  key={contact.id}
                  checked={contactIds.includes(contact.id)}
                  onChange={(checked) => setContactIds((ids) => toggle(ids, contact.id, checked))}
                >
                  {contact.fullName}
                </CheckRow>
              ))}
            </fieldset>
          )}

          {openTasks.length > 0 && (
            <fieldset className="space-y-1.5">
              <legend className="text-sm font-medium">Tareas que cumple</legend>
              {openTasks.map((task) => (
                <CheckRow
                  key={task.id}
                  checked={completesTaskIds.includes(task.id)}
                  onChange={(checked) => setCompletesTaskIds((ids) => toggle(ids, task.id, checked))}
                >
                  {task.description} <span className="text-muted-foreground">· vence {formatDay(task.dueDate)} · {task.assignee}</span>
                </CheckRow>
              ))}
            </fieldset>
          )}

          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-sm font-medium">Próxima tarea</p>
            <TaskFields idPrefix="crm-next-task" draft={nextTask} errors={nextTaskErrors} contacts={contacts} onChange={setNextTask} />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
          <DialogButtons onCancel={onClose} busy={recordAction.isPending} submitLabel="Registrar" busyLabel="Registrando..." disabled={!canSubmit} />
        </form>
      </DialogContent>
    </Dialog>
  )
}
