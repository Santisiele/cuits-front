import { useState } from "react"
import { useParams } from "react-router-dom"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useCrmCompany, useCrmMutations } from "@/hooks/useCrm"
import { getErrorMessage } from "@/lib/errors"
import { formatTaxId } from "@/lib/cuit"
import { CloseCompanyDialog } from "./CloseCompanyDialog"
import { formatIsoDate } from "@/lib/dates"
import { ChangeHistory } from "./ChangeHistory"
import { RecordActionDialog } from "./RecordActionDialog"
import { RemoveCompanyDialog } from "./RemoveCompanyDialog"
import { CompanyData } from "./company/CompanyData"
import { ContactsSection } from "./company/ContactsSection"
import { OpenTasks } from "./company/OpenTasks"
import { Timeline } from "./company/Timeline"
import { BackLink } from "./company/BackLink"

export function CrmCompanyScreen() {
  const { taxId = "" } = useParams()
  const detail = useCrmCompany(taxId)
  const [recording, setRecording] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [closing, setClosing] = useState(false)
  const { reopenCompany } = useCrmMutations()

  async function reopen(): Promise<void> {
    try {
      await reopenCompany.mutateAsync(taxId)
      toast.success("Se reabrió la empresa")
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  if (detail.isLoading) return <p className="text-muted-foreground text-sm">Cargando...</p>
  if (detail.error || !detail.data) {
    return (
      <div className="space-y-2">
        <BackLink />
        <p className="text-destructive text-sm">{getErrorMessage(detail.error, "No se pudo cargar la empresa")}</p>
      </div>
    )
  }

  const { company, contacts, actions, tasks } = detail.data
  const openTasks = tasks.filter((task) => task.status === "open")
  const names: Record<string, string> = Object.fromEntries([
    ...contacts.map((contact) => [contact.id, contact.fullName]),
    ...tasks.map((task) => [task.id, task.description]),
  ])

  return (
    <div className="flex flex-col gap-4">
      <BackLink />
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
            <div className="min-w-0">
              <CardTitle>{company.businessName || formatTaxId(company.taxId)}</CardTitle>
              <p className="text-sm text-muted-foreground font-mono">{formatTaxId(company.taxId)}</p>
              <div className="flex gap-2 flex-wrap mt-1">
                {company.closedAt && <Badge variant="destructive">Cerrada</Badge>}
                {company.nosisPending && <Badge variant="secondary">Pendiente de Nosis</Badge>}
              </div>
              {company.closedAt && (
                <p className="text-sm text-muted-foreground mt-1">
                  No va más desde el {formatIsoDate(company.closedAt)}
                  {company.closedBy && ` (${company.closedBy})`}: {company.closedReason}
                </p>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {company.closedAt ? (
                <Button onClick={() => void reopen()} disabled={reopenCompany.isPending}>Reabrir</Button>
              ) : (
                <>
                  <Button onClick={() => setRecording(true)}>Registrar acción</Button>
                  <Button variant="outline" onClick={() => setClosing(true)}>No va más</Button>
                </>
              )}
              <Button variant="ghost" onClick={() => setRemoving(true)}>Sacar del CRM</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <CompanyData key={`${company.crmBrand}|${company.crmProduct}|${company.crmOrigin}|${company.originSource}`} company={company} />
          <ChangeHistory entityType="CrmCompany" entityId={company.taxId} names={names} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <OpenTasks taxId={company.taxId} tasks={openTasks} contacts={contacts} names={names} closed={company.closedAt !== null} />
        <ContactsSection taxId={company.taxId} contacts={contacts} />
      </div>

      <Timeline actions={actions} tasks={tasks} names={names} />

      {recording && (
        <RecordActionDialog companyTaxId={company.taxId} contacts={contacts} openTasks={openTasks} onClose={() => setRecording(false)} />
      )}
      {closing && <CloseCompanyDialog taxId={company.taxId} businessName={company.businessName} onClose={() => setClosing(false)} />}
      {removing && <RemoveCompanyDialog taxId={company.taxId} businessName={company.businessName} onClose={() => setRemoving(false)} />}
    </div>
  )
}
