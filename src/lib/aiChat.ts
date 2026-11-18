import type { ExportColumn } from "@/lib/exportTable"
import type { AiChatMessage, AiChatTable, AiChatWithMessages } from "@/types"

export const QUESTION_MAX = 4000
export const POLL_MS = 3000

export function questionError(text: string): string | null {
  if (text.trim() === "") return "Escribí una pregunta"
  if (text.trim().length > QUESTION_MAX) return `La pregunta no puede tener más de ${QUESTION_MAX} caracteres`
  return null
}

export function runningMessage(messages: readonly AiChatMessage[]): AiChatMessage | undefined {
  return messages.find((message) => message.role === "assistant" && message.status === "running")
}

export function withMessage(data: AiChatWithMessages, message: AiChatMessage): AiChatWithMessages {
  return { ...data, messages: data.messages.map((item) => (item.id === message.id ? message : item)) }
}

function entityText(value: Record<string, unknown>): string | null {
  if (Array.isArray(value["_labels"])) {
    const name = value["businessName"] ?? value["fullName"] ?? value["name"] ?? value["title"]
    const id = value["id"]
    if (typeof name === "string" && typeof id === "string") return `${name} (${id})`
    if (typeof name === "string") return name
    if (typeof id === "string") return id
  }
  if (typeof value["_type"] === "string") {
    return typeof value["type"] === "string" ? value["type"] : value["_type"]
  }
  return null
}

export function cellText(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value
  if (typeof value === "number") return value.toLocaleString("es-AR")
  if (typeof value === "boolean") return value ? "Sí" : "No"
  if (Array.isArray(value)) return value.map(cellText).filter((text) => text !== "").join(", ")
  if (typeof value === "object") return entityText(value as Record<string, unknown>) ?? JSON.stringify(value)
  return String(value)
}

export function cuitOf(value: unknown): string | null {
  return typeof value === "string" && /^\d{11}$/.test(value) ? value : null
}

type ExportRow = Record<string, string>

export function tableExport(table: AiChatTable): { rows: ExportRow[]; columns: ExportColumn<ExportRow>[] } {
  const keys = table.columns.map((_, index) => `c${index}`)
  return {
    columns: table.columns.map((label, index) => ({ key: keys[index]!, label })),
    rows: table.rows.map((row) => Object.fromEntries(keys.map((key, index) => [key, cellText(row[index])]))),
  }
}

export function tableFileName(title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return slug === "" ? "listado" : slug
}

export function answerNote(message: AiChatMessage): string | null {
  if (message.status === "failed") return "No se pudo completar la respuesta. Intentá de nuevo"
  if (message.status === "budget_exhausted") return "Se alcanzó el tope de gasto del mes. La respuesta quedó a medias"
  return null
}
