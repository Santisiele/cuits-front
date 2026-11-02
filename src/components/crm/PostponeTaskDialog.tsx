import { useState } from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCrmMutations } from "@/hooks/useCrm"
import { getErrorMessage } from "@/lib/errors"
import { formatDay, hasErrors, optionalText, postponeErrors } from "@/lib/crm"
import type { CrmTask } from "@/types"
import { DialogButtons, Field } from "./CrmFields"

export function PostponeTaskDialog({ task, onClose }: { task: CrmTask; onClose: () => void }) {
  const { postponeTask } = useCrmMutations()
  const [dueDate, setDueDate] = useState("")
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")
  const errors = postponeErrors(task, dueDate, reason)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    if (hasErrors(errors)) return
    setError("")
    try {
      await postponeTask.mutateAsync({ id: task.id, input: { dueDate, reason: optionalText(reason) } })
      toast.success(`Se pospuso al ${formatDay(dueDate)}`)
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Posponer tarea</DialogTitle>
          <DialogDescription>
            {task.description} · vence {formatDay(task.dueDate)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <Field id="crm-postpone-date" label="Nueva fecha" error={dueDate ? errors.dueDate : null}>
            <Input id="crm-postpone-date" type="date" value={dueDate} min={task.dueDate} onChange={(e) => setDueDate(e.target.value)} autoFocus />
          </Field>
          <Field id="crm-postpone-reason" label="Motivo (opcional)" error={errors.reason}>
            <Textarea id="crm-postpone-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
          </Field>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <DialogButtons onCancel={onClose} busy={postponeTask.isPending} submitLabel="Posponer" busyLabel="Posponiendo..." disabled={hasErrors(errors)} />
        </form>
      </DialogContent>
    </Dialog>
  )
}
