import { describe, it, expect } from "vitest"
import {
  answerNote,
  cellText,
  cuitOf,
  questionError,
  runningMessage,
  tableExport,
  tableFileName,
  withMessage,
} from "@/lib/aiChat"
import type { AiChatMessage } from "@/types"

function message(overrides: Partial<AiChatMessage>): AiChatMessage {
  return {
    id: "m1",
    chatId: "c1",
    role: "assistant",
    createdAt: "2026-11-18T12:00:00.000Z",
    text: "",
    status: "done",
    sources: [],
    tables: [],
    model: "claude-opus-5-5",
    costUsd: 0,
    webSearches: 0,
    ...overrides,
  }
}

describe("questionError", () => {
  it("asks for a question of up to 4000 characters", () => {
    expect(questionError("  ")).toBe("Escribí una pregunta")
    expect(questionError("a".repeat(4001))).toBe("La pregunta no puede tener más de 4000 caracteres")
    expect(questionError(` ${"a".repeat(4000)} `)).toBeNull()
  })
})

describe("cellText", () => {
  it("writes every value the database can return as readable text", () => {
    expect(cellText(null)).toBe("")
    expect(cellText("ACME")).toBe("ACME")
    expect(cellText(1234567)).toBe("1.234.567")
    expect(cellText(true)).toBe("Sí")
    expect(cellText(false)).toBe("No")
    expect(cellText(["Bolsa", null, "Poseidon"])).toBe("Bolsa, Poseidon")
    expect(cellText({ _labels: ["CUIT"], id: "30712345678", businessName: "ACME SA" })).toBe("ACME SA (30712345678)")
    expect(cellText({ _labels: ["Source"], name: "Bolsa" })).toBe("Bolsa")
    expect(cellText({ _type: "RELATED_TO", type: "President" })).toBe("President")
    expect(cellText({ _type: "HAS_SOURCE" })).toBe("HAS_SOURCE")
    expect(cellText({ a: 1 })).toBe('{"a":1}')
  })
})

describe("tables", () => {
  it("recognises CUITs", () => {
    expect(cuitOf("30712345678")).toBe("30712345678")
    expect(cuitOf("30-71234567-8")).toBeNull()
    expect(cuitOf(30712345678)).toBeNull()
  })

  it("turns a table into rows and columns for the exporter", () => {
    expect(
      tableExport({ resultId: "r", title: "t", columns: ["cuit", "fuentes"], rows: [["1", ["A", "B"]]], truncated: false })
    ).toEqual({
      columns: [
        { key: "c0", label: "cuit" },
        { key: "c1", label: "fuentes" },
      ],
      rows: [{ c0: "1", c1: "A, B" }],
    })
  })

  it("names the file after the table", () => {
    expect(tableFileName("Operadores de Bolsa ↔ conocidos")).toBe("operadores-de-bolsa-conocidos")
    expect(tableFileName("¿?")).toBe("listado")
  })
})

describe("messages", () => {
  it("finds the running answer and swaps in the finished one", () => {
    const running = message({ id: "a", status: "running" })
    const data = { chat: { id: "c1", title: "t", createdAt: "", updatedAt: "", archivedAt: null }, messages: [message({ id: "q", role: "user" }), running] }
    expect(runningMessage(data.messages)).toBe(running)
    const updated = withMessage(data, { ...running, status: "done", text: "listo" })
    expect(updated.messages[1]).toMatchObject({ status: "done", text: "listo" })
    expect(runningMessage(updated.messages)).toBeUndefined()
  })

  it("explains failed and cut answers", () => {
    expect(answerNote(message({ status: "failed" }))).toBe("No se pudo completar la respuesta. Intentá de nuevo")
    expect(answerNote(message({ status: "budget_exhausted" }))).toContain("tope de gasto")
    expect(answerNote(message({ status: "done" }))).toBeNull()
  })
})
