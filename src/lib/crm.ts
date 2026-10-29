import type { CrmAction, CrmLastAction, CrmRemovalResult, CrmTask, CrmTaskStatus, CrmResponsible } from "@/types"

export const MAX_NAME_LENGTH = 200
export const MAX_TEXT_LENGTH = 2000

export const CUIT_ERROR = "El CUIT tiene que tener 11 números"
export const DATE_ERROR = "La fecha no es válida"
export const BIRTHDAY_ERROR = "La fecha tiene que ser dd/mm/aaaa"
export const NAME_TOO_LONG = `Hasta ${MAX_NAME_LENGTH} caracteres`
export const TEXT_TOO_LONG = `Hasta ${MAX_TEXT_LENGTH} caracteres`
export const DESCRIPTION_REQUIRED = "Contá qué se hizo"
export const TASK_DESCRIPTION_REQUIRED = "Escribí la tarea"
export const BUSINESS_NAME_REQUIRED = "Falta la razón social"
export const FULL_NAME_REQUIRED = "Falta el nombre"
export const CANCEL_REASON_REQUIRED = "Indicá por qué se cancela la tarea"
export const CLOSE_REASON_REQUIRED = "Indicá por qué la empresa no va más"

export const SOURCE_CATEGORY_LABELS: Record<string, string> = {
  known: "Conocidos",
  toKnow: "Por conocer",
}

export const TASK_STATUS_LABELS: Record<CrmTaskStatus, string> = {
  open: "Abierta",
  done: "Hecha",
  cancelled: "Cancelada",
}

export const CHANGE_OPERATION_LABELS: Record<string, string> = {
  create: "Creó",
  update: "Editó",
  archive: "Archivó",
  restore: "Restauró",
  complete: "Completó",
  cancel: "Canceló",
  crm_add: "Agregó al CRM",
  crm_remove: "Sacó del CRM",
  close: "Cerró la empresa",
  reopen: "Reabrió la empresa",
}

export const CHANGE_FIELD_LABELS: Record<string, string> = {
  businessName: "Razón social",
  crmBrand: "Marca",
  crmProduct: "Producto",
  crmOrigin: "Origen",
  fullName: "Nombre",
  phone: "Teléfono",
  email: "Email",
  birthday: "Cumpleaños",
  cuil: "CUIL",
  companyTaxIds: "Empresas",
  companyTaxId: "Empresa",
  date: "Fecha",
  description: "Descripción",
  contactIds: "Contactos",
  completedTaskIds: "Tareas cumplidas",
  createdTaskId: "Próxima tarea",
  dueDate: "Vence",
  assignee: "Responsable",
  status: "Estado",
  cancelReason: "Motivo",
  archivedAt: "Archivado",
  outcome: "Resultado",
  originSource: "Fuente de origen",
  closedAt: "Cerrada",
  closedReason: "Motivo de cierre",
  byAction: "Por la acción",
  asContact: "Como contacto",
}

const CANCEL_REASON_LABELS: Record<string, string> = {
  company_removed: "La empresa salió del CRM",
}

const REMOVAL_TEXT: Record<CrmRemovalResult["outcome"], string> = {
  unlinked: "Sale del CRM. El CUIT queda en la base por sus otras fuentes o relaciones.",
  archived: "Sale del CRM y se archiva con su historial: contactos, acciones y tareas quedan guardados.",
  deleted: "Sale del CRM y el CUIT se borra de la base, porque no le queda ninguna fuente ni relación.",
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const BIRTHDAY = /^(\d{2})\/(\d{2})\/(\d{4})$/

function isRealDate(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export function cuitDigits(input: string): string {
  return input.replace(/\D/g, "")
}

export function cuitError(input: string): string | null {
  return cuitDigits(input).length === 11 ? null : CUIT_ERROR
}

export function isValidIsoDate(value: string): boolean {
  const match = ISO_DATE.exec(value)
  return !!match && isRealDate(Number(match[1]), Number(match[2]), Number(match[3]))
}

export function dateError(value: string): string | null {
  return isValidIsoDate(value) ? null : DATE_ERROR
}

export function birthdayError(value: string): string | null {
  const trimmed = value.trim()
  if (trimmed === "") return null
  const match = BIRTHDAY.exec(trimmed)
  return match && isRealDate(Number(match[3]), Number(match[2]), Number(match[1])) ? null : BIRTHDAY_ERROR
}

export function requiredTextError(value: string, missing: string, max: number = MAX_TEXT_LENGTH): string | null {
  const trimmed = value.trim()
  if (trimmed === "") return missing
  return trimmed.length > max ? (max === MAX_NAME_LENGTH ? NAME_TOO_LONG : TEXT_TOO_LONG) : null
}

export function optionalNameError(value: string): string | null {
  return value.trim().length > MAX_NAME_LENGTH ? NAME_TOO_LONG : null
}

export function cancelReasonError(value: string): string | null {
  return requiredTextError(value, CANCEL_REASON_REQUIRED)
}

export function closeReasonError(value: string): string | null {
  return requiredTextError(value, CLOSE_REASON_REQUIRED)
}

export interface OriginDraft {
  mode: "text" | "source"
  text: string
  source: string
}

export function originDraftOf(company: { crmOrigin: string | null; originSource: string | null } | null): OriginDraft {
  if (company?.originSource) return { mode: "source", text: "", source: company.originSource }
  return { mode: "text", text: company?.crmOrigin ?? "", source: "" }
}

export function originInput(draft: OriginDraft): { crmOrigin: string | null; originSource: string | null } {
  return draft.mode === "source" && draft.source
    ? { crmOrigin: null, originSource: draft.source }
    : { crmOrigin: optionalText(draft.text), originSource: null }
}

export function originLabel(company: { crmOrigin: string | null; originSource: string | null }): string {
  return company.originSource ? `Fuente: ${company.originSource}` : company.crmOrigin ?? "—"
}

export function optionalText(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

export function todayInBuenosAires(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
}

export function isOverdue(dueDate: string, today: string): boolean {
  return dueDate <= today
}

export function formatDay(iso: string | null): string {
  if (!iso) return "—"
  const match = ISO_DATE.exec(iso)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : iso
}

export function removalText(result: CrmRemovalResult): string {
  const tasks =
    result.cancelledTaskCount === 0
      ? ""
      : result.cancelledTaskCount === 1
        ? " Se cancela su tarea abierta."
        : ` Se cancelan sus ${result.cancelledTaskCount} tareas abiertas.`
  return REMOVAL_TEXT[result.outcome] + tasks
}

export function cancelReasonLabel(reason: string | null): string {
  if (!reason) return ""
  return CANCEL_REASON_LABELS[reason] ?? reason
}

export interface TaskDraft {
  description: string
  dueDate: string
  assignee: string
  contactIds: string[]
}

export interface TaskDraftErrors {
  description: string | null
  dueDate: string | null
  assignee: string | null
}

export const RESPONSIBLE_REQUIRED = "Elegí quién"
export const RESPONSIBLE_NAME_ERROR = "El nombre tiene que tener entre 2 y 40 caracteres"

export function responsibleNameError(value: string): string | null {
  const length = value.trim().replace(/\s+/g, " ").length
  return length >= 2 && length <= 40 ? null : RESPONSIBLE_NAME_ERROR
}

export function taskDraftErrors(draft: TaskDraft): TaskDraftErrors {
  return {
    description: requiredTextError(draft.description, TASK_DESCRIPTION_REQUIRED),
    dueDate: dateError(draft.dueDate),
    assignee: draft.assignee.trim() === "" ? RESPONSIBLE_REQUIRED : null,
  }
}

export function hasErrors(errors: object): boolean {
  return Object.values(errors).some((value) => value !== null)
}

export type TimelineEntry =
  | { kind: "action"; day: string; action: CrmAction; fulfilled: CrmTask[]; next: CrmTask | null }
  | { kind: "task"; day: string; task: CrmTask }

export function buildTimeline(actions: readonly CrmAction[], tasks: readonly CrmTask[]): TimelineEntry[] {
  const byId = new Map(tasks.map((task) => [task.id, task]))
  const fulfilledByAction = new Set(actions.flatMap((action) => action.completedTaskIds))
  const entries: TimelineEntry[] = [
    ...actions.map((action) => ({
      kind: "action" as const,
      day: action.date,
      action,
      fulfilled: action.completedTaskIds.flatMap((id) => byId.get(id) ?? []),
      next: action.createdTaskId ? byId.get(action.createdTaskId) ?? null : null,
    })),
    ...tasks
      .filter((task) => task.status !== "open" && !fulfilledByAction.has(task.id))
      .map((task) => ({ kind: "task" as const, day: (task.closedAt ?? task.createdAt).slice(0, 10), task })),
  ]
  return entries.sort((a, b) => b.day.localeCompare(a.day))
}

export const COMPANY_REQUIRED = "Elegí la empresa"

export function companyMatches(company: { taxId: string; businessName: string }, search: string): boolean {
  const needle = nameKey(search)
  if (needle === "") return true
  const digits = search.replace(/\D/g, "")
  return nameKey(company.businessName).includes(needle) || (digits.length >= 3 && company.taxId.includes(digits))
}

export function matchCompanies<T extends { taxId: string; businessName: string }>(companies: readonly T[], search: string, limit = 8): T[] {
  if (nameKey(search) === "") return []
  return companies
    .filter((company) => companyMatches(company, search))
    .sort((a, b) => a.businessName.localeCompare(b.businessName, "es"))
    .slice(0, limit)
}

export function taskChanges(task: CrmTask, draft: TaskDraft): Partial<{ description: string; dueDate: string; assignee: string; contactIds: string[] }> {
  const description = draft.description.trim()
  const sameContacts =
    draft.contactIds.length === task.contactIds.length && draft.contactIds.every((id) => task.contactIds.includes(id))
  return {
    ...(description !== task.description && { description }),
    ...(draft.dueDate !== task.dueDate && { dueDate: draft.dueDate }),
    ...(draft.assignee !== task.assignee && { assignee: draft.assignee }),
    ...(!sameContacts && { contactIds: draft.contactIds }),
  }
}

function nameKey(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase()
}

export function ownResponsible(responsibles: readonly CrmResponsible[], username: string | null): string | null {
  if (!username) return null
  const own = responsibles.find(
    (responsible) => !responsible.disabled && responsible.users.length === 1 && sameUser(responsible.users[0]!, username)
  )
  return own?.name ?? null
}

export function responsibleKey(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase()
}

export function sameResponsible(a: string, b: string): boolean {
  return responsibleKey(a) === responsibleKey(b)
}

export function toggleId(list: readonly string[], id: string, checked: boolean): string[] {
  if (checked) return list.includes(id) ? [...list] : [...list, id]
  return list.filter((other) => other !== id)
}

export function responsibleColor(name: string, responsibles: readonly CrmResponsible[]): string {
  return responsibles.find((responsible) => sameResponsible(responsible.name, name))?.color ?? "slate"
}

function sameUser(a: string | null, b: string): boolean {
  return !!a && a.trim().toLowerCase() === b.trim().toLowerCase()
}

export function responsiblesOf(responsibles: readonly CrmResponsible[], username: string | null): string[] {
  if (!username) return []
  return responsibles
    .filter((responsible) => !responsible.disabled && responsible.users.some((user) => sameUser(user, username)))
    .map((responsible) => responsible.name)
}

function holds(mine: readonly string[], name: string): boolean {
  return mine.some((own) => sameResponsible(own, name))
}

export function canChangeTask(username: string | null, isAdmin: boolean, task: CrmTask, mine: readonly string[] = []): boolean {
  return isAdmin || sameUser(username, task.createdBy) || holds(mine, task.assignee)
}

export function recordedForSomeoneElse(action: CrmAction, responsibles: readonly CrmResponsible[]): boolean {
  if (!action.recordedBy) return false
  return !holds(responsiblesOf(responsibles, action.recordedBy), action.doneBy) && !sameResponsible(action.recordedBy, action.doneBy)
}

export function canChangeAction(username: string | null, isAdmin: boolean, action: CrmAction, mine: readonly string[] = []): boolean {
  return isAdmin || sameUser(username, action.recordedBy) || holds(mine, action.doneBy)
}

export function describeChangeValue(value: unknown, names: Readonly<Record<string, string>> = {}): string {
  if (value === null || value === undefined || value === "") return "—"
  if (Array.isArray(value)) return value.length === 0 ? "—" : value.map((item) => describeChangeValue(item, names)).join(", ")
  if (typeof value === "string" && value in names) return names[value]!
  if (typeof value === "boolean") return value ? "Sí" : "No"
  if (typeof value === "string" && value in TASK_STATUS_LABELS) return TASK_STATUS_LABELS[value as CrmTaskStatus]
  if (typeof value === "string" && value in CANCEL_REASON_LABELS) return CANCEL_REASON_LABELS[value]!
  if (typeof value === "string" && ISO_DATE.test(value)) return formatDay(value)
  return String(value)
}

export function splitLastAction(action: CrmLastAction | null): { withWhom: string; what: string } {
  if (!action) return { withWhom: "", what: "" }
  if (action.contacts.length > 0) return { withWhom: action.contacts.join(", "), what: action.description }
  const imported = /^Con ([^:]+):\s*([\s\S]*)$/.exec(action.description)
  return imported ? { withWhom: imported[1]!.trim(), what: imported[2]! } : { withWhom: "", what: action.description }
}
