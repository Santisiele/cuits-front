import { useState } from "react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCrmMutations } from "@/hooks/useCrm"
import { getErrorMessage } from "@/lib/errors"
import { hasErrors, taskDraftErrors, type TaskDraft } from "@/lib/crm"
import type { CrmContact, CrmTask } from "@/types"
import { DialogButtons } from "./CrmFields"
import { TaskFields } from "./TaskFields"

export function TaskDialog({
  companyTaxId,
  task,
  contacts,
  onClose,
}: {
  companyTaxId: string
  task: CrmTask | null
  contacts: CrmContact[]
  onClose: () => void
}) {
  const { createTask, updateTask } = useCrmMutations()
  const [draft, setDraft] = useState<TaskDraft>({
    description: task?.description ?? "",
    dueDate: task?.dueDate ?? "",
    assignee: task?.assignee ?? "",
    contactIds: task?.contactIds ?? [],
  })
  const [error, setError] = useState("")
  const errors = taskDraftErrors(draft)
  const busy = createTask.isPending || updateTask.isPending

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    if (hasErrors(errors)) return
    setError("")
    const input = {
      description: draft.description.trim(),
      dueDate: draft.dueDate,
      assignee: draft.assignee || null,
      contactIds: draft.contactIds,
    }
    try {
      if (task) await updateTask.mutateAsync({ id: task.id, input })
      else await createTask.mutateAsync({ ...input, companyTaxId })
      toast.success(task ? "Se guardó la tarea" : "Se agregó la tarea")
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <TaskFields idPrefix="crm-task" draft={draft} errors={errors} contacts={contacts} onChange={setDraft} />
          {error && <p className="text-destructive text-sm">{error}</p>}
          <DialogButtons onCancel={onClose} busy={busy} submitLabel="Guardar" busyLabel="Guardando..." disabled={hasErrors(errors)} />
        </form>
      </DialogContent>
    </Dialog>
  )
}
