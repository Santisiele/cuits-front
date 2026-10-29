import { USER_COLOR_KEYS, isUserColor, type UserColor } from "@/lib/userColors"
import type { CrmAction, CrmRemovalResult, CrmTask, CrmTaskStatus, CrmUser } from "@/types"

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
}

export function taskDraftErrors(draft: TaskDraft): TaskDraftErrors {
  return {
    description: requiredTextError(draft.description, TASK_DESCRIPTION_REQUIRED),
    dueDate: dateError(draft.dueDate),
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

export function matchCompanies<T extends { taxId: string; businessName: string }>(companies: readonly T[], search: string, limit = 8): T[] {
  const needle = nameKey(search)
  if (needle === "") return []
  const digits = search.replace(/\D/g, "")
  return companies
    .filter((company) => nameKey(company.businessName).includes(needle) || (digits.length >= 3 && company.taxId.includes(digits)))
    .sort((a, b) => a.businessName.localeCompare(b.businessName, "es"))
    .slice(0, limit)
}

function nameKey(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase()
}

export function userColor(username: string, users: readonly CrmUser[]): UserColor {
  const chosen = users.find((user) => sameUser(user.username, username))?.color
  if (isUserColor(chosen)) return chosen
  const taken = new Set(users.map((user) => user.color).filter(isUserColor))
  const free = USER_COLOR_KEYS.filter((color) => !taken.has(color))
  const palette = free.length > 0 ? free : USER_COLOR_KEYS
  const withoutColor = users
    .filter((user) => !isUserColor(user.color))
    .map((user) => user.username.trim().toLowerCase())
    .sort()
  const position = withoutColor.indexOf(username.trim().toLowerCase())
  if (position >= 0) return palette[position % palette.length]!
  let hash = 0
  for (const char of username.trim().toLowerCase()) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return palette[hash % palette.length]!
}

function sameUser(a: string | null, b: string): boolean {
  return !!a && a.trim().toLowerCase() === b.trim().toLowerCase()
}

export function canChangeTask(username: string | null, isAdmin: boolean, task: CrmTask): boolean {
  return isAdmin || sameUser(username, task.createdBy) || sameUser(username, task.assignee)
}

export function canChangeAction(username: string | null, isAdmin: boolean, action: CrmAction): boolean {
  return isAdmin || sameUser(username, action.doneBy)
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
