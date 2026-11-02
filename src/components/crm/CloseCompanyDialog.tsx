import { useState } from "react"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCrmMutations } from "@/hooks/useCrm"
import { getErrorMessage } from "@/lib/errors"
import { closeReasonError } from "@/lib/crm"
import { DialogButtons, Field } from "./CrmFields"

export function CloseCompanyDialog({ taxId, businessName, onClose }: { taxId: string; businessName: string; onClose: () => void }) {
  const { closeCompany } = useCrmMutations()
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")
  const problem = closeReasonError(reason)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    if (problem) return
    setError("")
    try {
      const result = await closeCompany.mutateAsync({ taxId, reason: reason.trim() })
      const tasks = result.cancelledTaskCount === 1 ? " Se canceló su tarea abierta." : result.cancelledTaskCount > 1 ? ` Se cancelaron ${result.cancelledTaskCount} tareas abiertas.` : ""
      toast.success(`${businessName} quedó cerrada.${tasks}${result.inservible ? " Pasó a Inservible." : ""}`)
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>La empresa no va más</DialogTitle>
          <DialogDescription>
            {businessName}: se cancelan sus tareas abiertas y, si está en alguna de nuestras fuentes, pasa al nivel Inservible con este motivo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <Field id="crm-close-reason" label="Motivo" error={reason ? problem : null}>
            <Textarea id="crm-close-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} autoFocus />
          </Field>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <DialogButtons onCancel={onClose} busy={closeCompany.isPending} submitLabel="Cerrar empresa" busyLabel="Cerrando..." disabled={!!problem} />
        </form>
      </DialogContent>
    </Dialog>
  )
}
