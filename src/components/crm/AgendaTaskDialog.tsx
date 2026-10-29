import { useState } from "react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCrmCompanies, useCrmMutations } from "@/hooks/useCrm"
import { getErrorMessage } from "@/lib/errors"
import { COMPANY_REQUIRED, hasErrors, taskDraftErrors, type TaskDraft } from "@/lib/crm"
import { CompanyPicker } from "./CompanyPicker"
import { DialogButtons, Field } from "./CrmFields"
import { TaskFields } from "./TaskFields"

export function AgendaTaskDialog({ onClose }: { onClose: () => void }) {
  const companies = useCrmCompanies()
  const { createTask } = useCrmMutations()
  const [companyTaxId, setCompanyTaxId] = useState("")
  const [draft, setDraft] = useState<TaskDraft>({ description: "", dueDate: "", assignee: "", contactIds: [] })
  const [error, setError] = useState("")
  const errors = taskDraftErrors(draft)
  const canSubmit = companyTaxId !== "" && !hasErrors(errors)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    if (!canSubmit) return
    setError("")
    try {
      await createTask.mutateAsync({
        companyTaxId,
        description: draft.description.trim(),
        dueDate: draft.dueDate,
        assignee: draft.assignee || null,
        contactIds: [],
      })
      toast.success("Se agregó la tarea")
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva tarea</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <Field id="crm-agenda-company" label="Empresa" hint={companyTaxId ? undefined : companies.isLoading ? "Cargando empresas..." : COMPANY_REQUIRED}>
            <CompanyPicker id="crm-agenda-company" companies={companies.data ?? []} value={companyTaxId} onChange={setCompanyTaxId} />
          </Field>
          <TaskFields idPrefix="crm-agenda-task" draft={draft} errors={errors} contacts={[]} onChange={setDraft} />
          {error && <p className="text-destructive text-sm">{error}</p>}
          <DialogButtons onCancel={onClose} busy={createTask.isPending} submitLabel="Agregar" busyLabel="Agregando..." disabled={!canSubmit} />
        </form>
      </DialogContent>
    </Dialog>
  )
}
