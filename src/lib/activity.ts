import { formatTaxId } from "@/lib/cuit"
import { formatDay } from "@/lib/crm"
import type { ActivityEntry } from "@/types"

type Details = Record<string, unknown>

function text(value: unknown): string {
  return typeof value === "string" ? value : value === null || value === undefined ? "" : String(value)
}

function cuit(value: unknown): string {
  const raw = text(value)
  return /^\d{11}$/.test(raw) ? formatTaxId(raw) : raw
}

function quoted(value: unknown): string {
  return `“${text(value)}”`
}

function count(value: unknown, singular: string, plural: string): string {
  const n = Number(value)
  return `${Number.isFinite(n) ? n : 0} ${n === 1 ? singular : plural}`
}

const CRM_OPERATIONS: Record<string, string> = {
  create: "creó",
  update: "editó",
  archive: "archivó",
  restore: "restauró",
  crm_add: "agregó al CRM",
  crm_remove: "sacó del CRM",
  close: "cerró",
  reopen: "reabrió",
  cancel: "canceló",
  cancelled: "canceló",
  complete: "completó",
  done: "completó",
}

const REMOVAL_OUTCOMES: Record<string, string> = {
  unlinked: "quedó en la base",
  archived: "se archivó con su historial",
  deleted: "se borró de la base",
}

function crmEntity(details: Details): string {
  switch (details["entityType"]) {
    case "CrmCompany":
      return `la empresa ${details["businessName"] ? text(details["businessName"]) + " " : ""}(${cuit(details["entityId"])})`
    case "Contact":
      return `el contacto ${text(details["fullName"]) || text(details["entityId"])}`
    case "Action":
      return `la acción de ${text(details["doneBy"])} del ${formatDay(text(details["date"]) || null)} en ${cuit(details["companyTaxId"])}: ${quoted(details["description"])}`
    case "Task":
      return `la tarea ${quoted(details["description"])} de ${text(details["assignee"])} (vence ${formatDay(text(details["dueDate"]) || null)}) en ${cuit(details["companyTaxId"])}`
    case "Responsible":
      return `el responsable ${text(details["entityId"])}`
    default:
      return `${text(details["entityType"])} ${text(details["entityId"])}`
  }
}

function crmSentence(user: string, details: Details): string {
  const operation = text(details["operation"])
  if (details["entityType"] === "Action" && operation === "create") {
    const next = details["nextTask"] ? ` y dejó la próxima tarea ${quoted(details["nextTask"])} para ${text(details["nextAssignee"])}` : ""
    return `${user} registró ${crmEntity(details)}${next}`
  }
  const verb = CRM_OPERATIONS[operation] ?? operation
  const extras = [
    operation === "crm_remove" && REMOVAL_OUTCOMES[text(details["outcome"])],
    operation === "close" && details["reason"] && `motivo: ${quoted(details["reason"])}`,
    operation === "close" && details["inservible"] === true && "pasó a Inservible",
    (operation === "cancel" || operation === "cancelled") && details["cancelReason"] && `motivo: ${quoted(details["cancelReason"])}`,
  ].filter(Boolean)
  return `${user} ${verb} ${crmEntity(details)}${extras.length > 0 ? ` (${extras.join(", ")})` : ""}`
}

const SOURCE_OPERATIONS: Record<string, string> = {
  source_rename: "renombrar la fuente",
  source_merge: "unificar la fuente",
  source_delete: "borrar la fuente",
  node_source_change: "cambiar la fuente de un CUIT en",
}

const SOURCE_STAGES: Record<string, string> = {
  initiated: "empezó a",
  completed: "terminó de",
  failed: "falló al",
}

function sourceSentence(user: string, event: string, details: Details): string | null {
  const match = /^(.*)_(initiated|completed|failed)$/.exec(event)
  if (!match || !(match[1]! in SOURCE_OPERATIONS)) return null
  const error = match[2] === "failed" && details["error"] ? `: ${text(details["error"])}` : ""
  return `${user} ${SOURCE_STAGES[match[2]!]} ${SOURCE_OPERATIONS[match[1]!]} ${quoted(details["sourceName"])}${error}`
}

export function describeActivity(entry: ActivityEntry): string {
  const user = entry.username ?? "Alguien"
  const d = entry.details
  switch (entry.event) {
    case "startup":
      return "Se inició la API"
    case "login":
      return `${user} inició sesión`
    case "login_failed":
      return `Intento fallido de ingreso con el usuario ${user}`
    case "logout":
      return `${user} cerró sesión`
    case "unauthorized":
      return `Pedido sin sesión válida a ${text(d["url"])}`
    case "forbidden":
      return `${user} intentó entrar a ${text(d["url"])} sin permiso`
    case "user_operation": {
      const target = text(d["target"])
      if (d["operation"] === "create") return `${user} creó el usuario ${target}`
      if (d["operation"] === "reset_password") return `${user} reseteó la contraseña de ${target}`
      if (d["operation"] === "change_own_password") return `${user} cambió su contraseña`
      const changes = [
        d["role"] && `rol ${text(d["role"]) === "admin" ? "admin" : "común"}`,
        d["disabled"] === true && "deshabilitado",
        d["disabled"] === false && "habilitado",
      ].filter(Boolean)
      return `${user} modificó el usuario ${target}${changes.length > 0 ? ` (${changes.join(", ")})` : ""}`
    }
    case "crm_operation":
      return crmSentence(user, d)
    case "cuit_search":
      return `${user} buscó el CUIT ${cuit(d["taxId"])}${d["found"] === false ? " (no encontrado)" : ""}`
    case "name_search":
      return `${user} buscó por nombre ${quoted(d["query"])} (${count(d["resultCount"], "resultado", "resultados")})`
    case "path_search":
      return `${user} buscó la relación entre ${cuit(d["from"])} y ${cuit(d["to"])}${d["found"] === false ? " (sin camino)" : ""}`
    case "relationship_added":
      return `${user} agregó la relación ${text(d["relationshipType"])} entre ${cuit(d["fromTaxId"])} y ${cuit(d["toTaxId"])}`
    case "relationship_deleted":
      return `${user} borró la relación ${text(d["relationshipType"])} entre ${cuit(d["fromTaxId"])} y ${cuit(d["toTaxId"])}`
    case "node_viewed":
      return d["found"] === false
        ? `${user} buscó el CUIT ${cuit(d["taxId"])}, que no existe`
        : `${user} abrió el CUIT ${cuit(d["taxId"])}${d["businessName"] ? ` (${text(d["businessName"])})` : ""}`
    case "node_relationships_viewed":
      return `${user} vio las relaciones de ${cuit(d["taxId"])}`
    case "node_updated":
      return `${user} editó los datos del CUIT ${cuit(d["taxId"])}`
    case "my_base_viewed":
      return `${user} vio su base (${count(d["nodeCount"], "CUIT", "CUITs")})`
    case "companies_viewed":
      return `${user} vio Empresas a buscar (${count(d["nodeCount"], "empresa", "empresas")})`
    case "to_know_viewed":
      return `${user} vio Por conocer (${count(d["nodeCount"], "CUIT", "CUITs")})`
    case "all_my_nodes_viewed":
      return d["source"]
        ? `${user} vio la base completa de ${quoted(d["source"])} (${count(d["nodeCount"], "CUIT", "CUITs")})`
        : `${user} vio la base completa (${count(d["nodeCount"], "CUIT", "CUITs")})`
    case "crossing_viewed":
      return `${user} cruzó ${Array.isArray(d["sources"]) ? (d["sources"] as unknown[]).map(text).join(" × ") : ""} (${count(d["nodeCount"], "CUIT", "CUITs")})`
    case "birthdays_viewed":
      return `${user} vio los cumpleaños del ${text(d["from"])} al ${text(d["to"])}`
    case "birthday_progress_viewed":
      return `${user} vio la carga de cumpleaños`
    case "trust_levels_viewed":
      return `${user} vio los niveles de confianza`
    case "trust_level_members_viewed":
      return `${user} vio los CUITs de un nivel de confianza (${count(d["memberCount"], "CUIT", "CUITs")})`
    case "create_level":
      return `${user} creó el nivel ${quoted(d["label"])}`
    case "update_level":
      return `${user} editó el nivel ${quoted(d["label"])}`
    case "delete_level":
      return `${user} borró el nivel ${quoted(d["label"])} (${count(d["affectedNodeCount"], "CUIT quedó", "CUITs quedaron")} sin nivel)`
    case "source_created":
      return `${user} registró la fuente ${quoted(d["sourceName"])}`
    case "web_research":
      return `${user} investigó en la web el CUIT ${cuit(d["taxId"])}${d["status"] === "failed" ? " y falló" : ""} (US$ ${text(d["costUsd"])})`
    case "research_archived":
      return `${user} archivó una investigación web del CUIT ${cuit(d["taxId"])}`
    case "research_restored":
      return `${user} restauró una investigación web del CUIT ${cuit(d["taxId"])}`
    case "research_budget_changed":
      return `${user} fijó el tope mensual de investigación web en US$ ${text(d["monthlyLimitUsd"])}`
    default:
      return sourceSentence(user, entry.event, d) ?? `${user}: ${entry.event}`
  }
}

export interface ActivityCursor {
  before: string
  seen: number
}

export function activityCursor(entries: readonly ActivityEntry[]): ActivityCursor | undefined {
  const last = entries[entries.length - 1]
  if (!last) return undefined
  return { before: last.time, seen: entries.filter((entry) => entry.time === last.time).length }
}

export const ACTIVITY_EVENT_LABELS: Record<string, string> = {
  crm_operation: "CRM",
  login: "Ingresos",
  login_failed: "Ingresos fallidos",
  logout: "Salidas",
  user_operation: "Usuarios",
  node_updated: "Edición de CUITs",
  relationship_added: "Relaciones agregadas",
  relationship_deleted: "Relaciones borradas",
  cuit_search: "Búsquedas por CUIT",
  name_search: "Búsquedas por nombre",
  node_viewed: "CUITs abiertos",
  forbidden: "Accesos denegados",
  unauthorized: "Pedidos sin sesión",
  web_research: "Investigación web",
  create_level: "Niveles creados",
  update_level: "Niveles editados",
  delete_level: "Niveles borrados",
}
