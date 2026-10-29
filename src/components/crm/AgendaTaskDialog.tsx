import { useState } from "react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCrmCompanies, useCrmMutations } from "@/hooks/useCrm"
import { useAuthStore } from "@/store/useAuthStore"
import { getErrorMessage } from "@/lib/errors"
import { COMPANY_REQUIRED, hasErrors, taskDraftErrors, type TaskDraft } from "@/lib/crm"
import { formatTaxId } from "@/lib/cuit"
import { DialogButtons, Field, NativeSelect } from "./CrmFields"
import { TaskFields } from "./TaskFields"

export function AgendaTaskDialog({ onClose }: { onClose: () => void }) {
  const companies = useCrmCompanies()
  const { createTask } = useCrmMutations()
  const me = useAuthStore((state) => state.username) ?? ""
  const [companyTaxId, setCompanyTaxId] = useState("")
  const [draft, setDraft] = useState<TaskDraft>({ description: "", dueDate: "", assignee: me, contactIds: [] })
  const [error, setError] = useState("")
  const errors = taskDraftErrors(draft)
  const options = [...(companies.data ?? [])].sort((a, b) => a.businessName.localeCompare(b.businessName, "es"))
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
          <Field id="crm-agenda-company" label="Empresa" hint={companyTaxId ? undefined : COMPANY_REQUIRED}>
            <NativeSelect id="crm-agenda-company" value={companyTaxId} onChange={(e) => setCompanyTaxId(e.target.value)} autoFocus>
              <option value="">{companies.isLoading ? "Cargando..." : "Elegí una empresa"}</option>
              {options.map((company) => (
                <option key={company.taxId} value={company.taxId}>
                  {company.businessName || formatTaxId(company.taxId)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <TaskFields idPrefix="crm-agenda-task" draft={draft} errors={errors} contacts={[]} onChange={setDraft} />
          {error && <p className="text-destructive text-sm">{error}</p>}
          <DialogButtons onCancel={onClose} busy={createTask.isPending} submitLabel="Agregar" busyLabel="Agregando..." disabled={!canSubmit} />
        </form>
      </DialogContent>
    </Dialog>
  )
}
