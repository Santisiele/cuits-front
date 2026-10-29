import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCrmMutations } from "@/hooks/useCrm"
import { getErrorMessage } from "@/lib/errors"
import { cuitDigits, cuitError, optionalNameError, optionalText, originDraftOf, originInput, type OriginDraft } from "@/lib/crm"
import { OriginField } from "./OriginField"
import { DialogButtons, Field } from "./CrmFields"

export function AddCompanyDialog({ onClose }: { onClose: () => void }) {
  const { addCompany } = useCrmMutations()
  const navigate = useNavigate()
  const [taxId, setTaxId] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [crmBrand, setCrmBrand] = useState("")
  const [crmProduct, setCrmProduct] = useState("")
  const [origin, setOrigin] = useState<OriginDraft>(() => originDraftOf(null))
  const [error, setError] = useState("")

  const taxIdProblem = taxId ? cuitError(taxId) : null
  const textProblems = [businessName, crmBrand, crmProduct, origin.mode === "text" ? origin.text : ""].map(optionalNameError)
  const canSubmit = !!taxId && !taxIdProblem && textProblems.every((problem) => problem === null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    if (!canSubmit) return
    setError("")
    try {
      const result = await addCompany.mutateAsync({
        taxId: cuitDigits(taxId),
        businessName: optionalText(businessName),
        crmBrand: optionalText(crmBrand),
        crmProduct: optionalText(crmProduct),
        ...originInput(origin),
      })
      toast.success(result.restored ? "Se restauró la empresa con su historial" : "Se agregó la empresa al CRM")
      onClose()
      void navigate(`/crm/${result.taxId}`)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar empresa</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <Field id="crm-add-cuit" label="CUIT" error={taxIdProblem}>
            <Input id="crm-add-cuit" value={taxId} onChange={(e) => setTaxId(e.target.value)} inputMode="numeric" autoFocus />
          </Field>
          <Field id="crm-add-name" label="Razón social" error={textProblems[0]} hint="Obligatoria si el CUIT todavía no está en la base">
            <Input id="crm-add-name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          </Field>
          <Field id="crm-add-brand" label="Marca" error={textProblems[1]}>
            <Input id="crm-add-brand" value={crmBrand} onChange={(e) => setCrmBrand(e.target.value)} />
          </Field>
          <Field id="crm-add-product" label="Producto o servicio" error={textProblems[2]}>
            <Input id="crm-add-product" value={crmProduct} onChange={(e) => setCrmProduct(e.target.value)} />
          </Field>
          <OriginField id="crm-add-origin" draft={origin} onChange={setOrigin} />
          {error && <p className="text-destructive text-sm">{error}</p>}
          <DialogButtons onCancel={onClose} busy={addCompany.isPending} submitLabel="Agregar" busyLabel="Agregando..." disabled={!canSubmit} />
        </form>
      </DialogContent>
    </Dialog>
  )
}
