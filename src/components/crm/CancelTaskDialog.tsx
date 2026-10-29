import { useState } from "react"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCrmMutations } from "@/hooks/useCrm"
import { getErrorMessage } from "@/lib/errors"
import { cancelReasonError } from "@/lib/crm"
import type { CrmTask } from "@/types"
import { DialogButtons, Field } from "./CrmFields"

export function CancelTaskDialog({ task, onClose }: { task: CrmTask; onClose: () => void }) {
  const { updateTask } = useCrmMutations()
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")
  const problem = cancelReasonError(reason)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    if (problem) return
    setError("")
    try {
      await updateTask.mutateAsync({ id: task.id, input: { status: "cancelled", cancelReason: reason.trim() } })
      toast.success("Se canceló la tarea")
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cancelar tarea</DialogTitle>
          <DialogDescription>{task.description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <Field id="crm-cancel-reason" label="Motivo" error={reason ? problem : null}>
            <Textarea id="crm-cancel-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} autoFocus />
          </Field>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <DialogButtons onCancel={onClose} busy={updateTask.isPending} submitLabel="Cancelar tarea" busyLabel="Cancelando..." disabled={!!problem} />
        </form>
      </DialogContent>
    </Dialog>
  )
}
