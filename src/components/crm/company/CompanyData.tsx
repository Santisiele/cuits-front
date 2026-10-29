import { useState } from "react"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCrmMutations } from "@/hooks/useCrm"
import { getErrorMessage } from "@/lib/errors"
import { optionalNameError, optionalText, originDraftOf, originInput, originLabel, type OriginDraft } from "@/lib/crm"
import type { CrmCompany } from "@/types"
import { OriginField } from "../OriginField"
import { Field } from "../CrmFields"

export function CompanyData({ company }: { company: CrmCompany }) {
  const { updateCompany } = useCrmMutations()
  const [editing, setEditing] = useState(false)
  const [crmBrand, setCrmBrand] = useState(company.crmBrand ?? "")
  const [crmProduct, setCrmProduct] = useState(company.crmProduct ?? "")
  const [origin, setOrigin] = useState<OriginDraft>(() => originDraftOf(company))
  const [error, setError] = useState("")
  const problems = [crmBrand, crmProduct, origin.mode === "text" ? origin.text : ""].map(optionalNameError)

  function startEditing(): void {
    setCrmBrand(company.crmBrand ?? "")
    setCrmProduct(company.crmProduct ?? "")
    setOrigin(originDraftOf(company))
    setError("")
    setEditing(true)
  }

  async function save(): Promise<void> {
    if (problems.some(Boolean)) return
    setError("")
    try {
      await updateCompany.mutateAsync({
        taxId: company.taxId,
        input: { crmBrand: optionalText(crmBrand), crmProduct: optionalText(crmProduct), ...originInput(origin) },
      })
      setEditing(false)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (!editing) {
    return (
      <div className="flex flex-col sm:flex-row gap-3 sm:items-start justify-between">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Marca</dt>
          <dd>{company.crmBrand ?? "—"}</dd>
          <dt className="text-muted-foreground">Producto</dt>
          <dd>{company.crmProduct ?? "—"}</dd>
          <dt className="text-muted-foreground">Origen</dt>
          <dd>{originLabel(company)}</dd>
        </dl>
        <Button variant="outline" size="sm" onClick={startEditing}>
          <Pencil className="w-4 h-4 mr-1" />
          Editar datos
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="crm-edit-brand" label="Marca" error={problems[0]}>
          <Input id="crm-edit-brand" value={crmBrand} onChange={(e) => setCrmBrand(e.target.value)} />
        </Field>
        <Field id="crm-edit-product" label="Producto" error={problems[1]}>
          <Input id="crm-edit-product" value={crmProduct} onChange={(e) => setCrmProduct(e.target.value)} />
        </Field>
      </div>
      <OriginField id="crm-edit-origin" draft={origin} onChange={setOrigin} />
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={() => void save()} disabled={problems.some(Boolean) || updateCompany.isPending}>
          {updateCompany.isPending ? "Guardando..." : "Guardar"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
      </div>
    </div>
  )
}
