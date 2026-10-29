import { TRUST_LEVEL_COLOR_KEYS } from "@/lib/trustLevels"
import type { CrmAction, CrmRemovalResult, CrmTask, CrmTaskStatus, CrmUser, TrustLevelColor } from "@/types"

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

export const COMPANY_REQUIRED = "Elegí la empresa"

export function userColor(username: string, users: readonly CrmUser[]): TrustLevelColor {
  const chosen = users.find((user) => sameUser(user.username, username))?.color
  if (chosen && (TRUST_LEVEL_COLOR_KEYS as readonly string[]).includes(chosen)) return chosen as TrustLevelColor
  const key = username.trim().toLowerCase()
  let hash = 0
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return TRUST_LEVEL_COLOR_KEYS[hash % TRUST_LEVEL_COLOR_KEYS.length]!
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
