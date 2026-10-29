import { useState } from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeft, Pencil, Plus, Trash2, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCrmCompany, useCrmMutations, useCrmResponsibles } from "@/hooks/useCrm"
import { useIsAdmin } from "@/hooks/useSessionRole"
import { useAuthStore } from "@/store/useAuthStore"
import { getErrorMessage } from "@/lib/errors"
import {
  TASK_STATUS_LABELS,
  buildTimeline,
  canChangeAction,
  canChangeTask,
  cancelReasonLabel,
  formatDay,
  isOverdue,
  optionalNameError,
  optionalText,
  originDraftOf,
  originInput,
  originLabel,
  responsiblesOf,
  type OriginDraft,
  todayInBuenosAires,
} from "@/lib/crm"
import { formatTaxId } from "@/lib/cuit"
import { cn } from "@/lib/utils"
import type { CrmAction, CrmCompany, CrmContact, CrmTask } from "@/types"
import { CancelTaskDialog } from "./CancelTaskDialog"
import { CloseCompanyDialog } from "./CloseCompanyDialog"
import { OriginField } from "./OriginField"
import { formatIsoDate } from "@/lib/dates"
import { ChangeHistory } from "./ChangeHistory"
import { ContactDialog } from "./ContactDialog"
import { Field } from "./CrmFields"
import { RecordActionDialog } from "./RecordActionDialog"
import { RemoveCompanyDialog } from "./RemoveCompanyDialog"
import { TaskDialog } from "./TaskDialog"

function CompanyData({ company }: { company: CrmCompany }) {
  const { updateCompany } = useCrmMutations()
  const [editing, setEditing] = useState(false)
  const [crmBrand, setCrmBrand] = useState(company.crmBrand ?? "")
  const [crmProduct, setCrmProduct] = useState(company.crmProduct ?? "")
  const [origin, setOrigin] = useState<OriginDraft>(() => originDraftOf(company))
  const [error, setError] = useState("")
  const problems = [crmBrand, crmProduct, origin.mode === "text" ? origin.text : ""].map(optionalNameError)

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
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
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

function ContactsSection({ taxId, contacts }: { taxId: string; contacts: CrmContact[] }) {
  const { archiveContact } = useCrmMutations()
  const [editing, setEditing] = useState<CrmContact | "new" | null>(null)

  async function archive(contact: CrmContact): Promise<void> {
    try {
      await archiveContact.mutateAsync(contact.id)
      toast.success(`Se archivó a ${contact.fullName}`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Contactos</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setEditing("new")}>
            <Plus className="w-4 h-4 mr-1" />
            Contacto
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin contactos.</p>
        ) : (
          <div className="divide-y divide-border">
            {contacts.map((contact) => (
              <div key={contact.id} className="py-2 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="text-sm space-y-0.5 min-w-0">
                  <p className="font-medium">{contact.fullName}</p>
                  <p className="text-muted-foreground break-words">
                    {[contact.phone, contact.email, contact.birthday && `cumple ${contact.birthday}`, contact.cuil && `CUIL ${formatTaxId(contact.cuil)}`]
                      .filter(Boolean)
                      .join(" · ") || "Sin datos de contacto"}
                  </p>
                  <ChangeHistory entityType="Contact" entityId={contact.id} names={{}} />
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="ghost" aria-label={`Editar ${contact.fullName}`} onClick={() => setEditing(contact)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" aria-label={`Archivar ${contact.fullName}`} onClick={() => void archive(contact)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      {editing && <ContactDialog companyTaxId={taxId} contact={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </Card>
  )
}

function OpenTasks({
  taxId,
  tasks,
  contacts,
  names,
  closed,
}: {
  taxId: string
  tasks: CrmTask[]
  contacts: CrmContact[]
  names: Record<string, string>
  closed: boolean
}) {
  const me = useAuthStore((state) => state.username)
  const isAdmin = useIsAdmin()
  const mine = responsiblesOf(useCrmResponsibles().data ?? [], me)
  const [editing, setEditing] = useState<CrmTask | "new" | null>(null)
  const [cancelling, setCancelling] = useState<CrmTask | null>(null)
  const today = todayInBuenosAires()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Tareas abiertas</CardTitle>
          {!closed && (
            <Button size="sm" variant="outline" onClick={() => setEditing("new")}>
              <Plus className="w-4 h-4 mr-1" />
              Tarea
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay tareas abiertas.</p>
        ) : (
          <div className="divide-y divide-border">
            {tasks.map((task) => {
              const allowed = canChangeTask(me, isAdmin, task, mine)
              const overdue = isOverdue(task.dueDate, today)
              return (
                <div key={task.id} data-testid={`task-${task.id}`} className="py-2 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="text-sm space-y-0.5 min-w-0">
                    <p className="font-medium break-words">{task.description}</p>
                    <p className="text-muted-foreground">
                      <span className={cn(overdue && "text-destructive font-medium")}>Vence {formatDay(task.dueDate)}</span>
                      {overdue && " · vencida"} · {task.assignee}
                      {task.contactIds.length > 0 && ` · con ${task.contactIds.map((id) => names[id] ?? "?").join(", ")}`}
                    </p>
                    <ChangeHistory entityType="Task" entityId={task.id} names={names} />
                  </div>
                  {allowed && (
                    <div className="flex gap-2 shrink-0 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => setCancelling(task)}>
                        <X className="w-4 h-4 mr-1" />
                        Cancelar
                      </Button>
                      <Button size="sm" variant="ghost" aria-label="Editar tarea" onClick={() => setEditing(task)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
      {editing && <TaskDialog companyTaxId={taxId} task={editing === "new" ? null : editing} contacts={contacts} onClose={() => setEditing(null)} />}
      {cancelling && <CancelTaskDialog task={cancelling} onClose={() => setCancelling(null)} />}
    </Card>
  )
}

function Timeline({ actions, tasks, names }: { actions: CrmAction[]; tasks: CrmTask[]; names: Record<string, string> }) {
  const { archiveAction } = useCrmMutations()
  const me = useAuthStore((state) => state.username)
  const isAdmin = useIsAdmin()
  const mine = responsiblesOf(useCrmResponsibles().data ?? [], me)
  const entries = buildTimeline(actions, tasks)

  async function archive(action: CrmAction): Promise<void> {
    try {
      await archiveAction.mutateAsync(action.id)
      toast.success("Se archivó la acción")
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Línea de tiempo</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no se registró nada.</p>
        ) : (
          <ol className="space-y-3">
            {entries.map((entry) =>
              entry.kind === "action" ? (
                <li key={entry.action.id} className="text-sm border-l-2 border-primary pl-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-muted-foreground">
                        {formatDay(entry.action.date)} · {entry.action.doneBy}
                        {entry.action.recordedBy && entry.action.recordedBy.toLowerCase() !== entry.action.doneBy.toLowerCase() &&
                          ` (cargó ${entry.action.recordedBy})`}
                        {entry.action.contactIds.length > 0 && ` · con ${entry.action.contactIds.map((id) => names[id] ?? "?").join(", ")}`}
                      </p>
                      <p className="whitespace-pre-wrap break-words">{entry.action.description}</p>
                      {entry.fulfilled.map((task) => (
                        <p key={task.id} className="text-muted-foreground break-words">✓ Cumplió: {task.description}</p>
                      ))}
                      {entry.next && (
                        <p className="text-muted-foreground break-words">
                          → Próxima: {entry.next.description} · {entry.next.assignee} · vence {formatDay(entry.next.dueDate)}
                          {entry.next.status !== "open" && ` (${TASK_STATUS_LABELS[entry.next.status].toLowerCase()})`}
                        </p>
                      )}
                    </div>
                    {canChangeAction(me, isAdmin, entry.action, mine) && (
                      <Button size="sm" variant="ghost" aria-label="Archivar acción" onClick={() => void archive(entry.action)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <ChangeHistory entityType="Action" entityId={entry.action.id} names={names} />
                </li>
              ) : (
                <li key={entry.task.id} className="text-sm border-l-2 border-border pl-3">
                  <p className="text-muted-foreground">
                    {formatDay(entry.day)} · {entry.task.assignee} ·{" "}
                    <Badge variant={entry.task.status === "done" ? "secondary" : "outline"}>{TASK_STATUS_LABELS[entry.task.status]}</Badge>
                  </p>
                  <p className="break-words">{entry.task.description}</p>
                  {entry.task.cancelReason && <p className="text-muted-foreground">Motivo: {cancelReasonLabel(entry.task.cancelReason)}</p>}
                  <ChangeHistory entityType="Task" entityId={entry.task.id} names={names} />
                </li>
              )
            )}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}

function BackLink() {
  const fromAgenda = (useLocation().state as { from?: string } | null)?.from === "agenda"
  return (
    <Link
      to={fromAgenda ? "/crm/agenda" : "/crm"}
      className="text-sm inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="w-4 h-4" /> {fromAgenda ? "Agenda" : "Empresas"}
    </Link>
  )
}

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
