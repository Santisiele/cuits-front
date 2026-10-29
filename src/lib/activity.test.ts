import { describe, it, expect } from "vitest"
import { activityCursor, describeActivity } from "@/lib/activity"
import type { ActivityEntry } from "@/types"

function entry(event: string, details: Record<string, unknown> = {}, username: string | null = "sol"): ActivityEntry {
  return { time: "2026-10-29T15:00:00.000Z", level: "info", event, username, details }
}

describe("describeActivity", () => {
  it("tells sessions apart", () => {
    expect(describeActivity(entry("login"))).toBe("sol inició sesión")
    expect(describeActivity(entry("logout"))).toBe("sol cerró sesión")
    expect(describeActivity(entry("login_failed", {}, "nadie"))).toBe("Intento fallido de ingreso con el usuario nadie")
    expect(describeActivity(entry("unauthorized", { url: "/crm/agenda" }, null))).toBe("Pedido sin sesión válida a /crm/agenda")
    expect(describeActivity(entry("forbidden", { url: "/users" }))).toBe("sol intentó entrar a /users sin permiso")
    expect(describeActivity(entry("startup", {}, null))).toBe("Se inició la API")
  })

  it("describes an action registered for someone else, with its next task", () => {
    expect(
      describeActivity(
        entry("crm_operation", {
          operation: "create",
          entityType: "Action",
          entityId: "a1",
          companyTaxId: "30712345678",
          doneBy: "Raul",
          date: "2026-10-29",
          description: "Lo llamó",
          nextTask: "Seguir",
          nextAssignee: "Raul",
        })
      )
    ).toBe("sol registró la acción de Raul del 29/10/2026 en 30-71234567-8: “Lo llamó” y dejó la próxima tarea “Seguir” para Raul")
  })

  it("describes company, task, contact and responsible changes", () => {
    expect(
      describeActivity(entry("crm_operation", { operation: "close", entityType: "CrmCompany", entityId: "30712345678", businessName: "ACME", reason: "Cerró", inservible: true }))
    ).toBe("sol cerró la empresa ACME (30-71234567-8) (motivo: “Cerró”, pasó a Inservible)")
    expect(describeActivity(entry("crm_operation", { operation: "crm_remove", entityType: "CrmCompany", entityId: "30712345678", outcome: "archived" }))).toBe(
      "sol sacó del CRM la empresa (30-71234567-8) (se archivó con su historial)"
    )
    expect(
      describeActivity(
        entry("crm_operation", {
          operation: "cancelled",
          entityType: "Task",
          entityId: "t1",
          description: "Llamar",
          assignee: "Raul",
          dueDate: "2026-11-02",
          companyTaxId: "30712345678",
          cancelReason: "No va",
        })
      )
    ).toBe("sol canceló la tarea “Llamar” de Raul (vence 02/11/2026) en 30-71234567-8 (motivo: “No va”)")
    expect(describeActivity(entry("crm_operation", { operation: "create", entityType: "Contact", entityId: "c1", fullName: "Ana" }))).toBe(
      "sol creó el contacto Ana"
    )
    expect(describeActivity(entry("crm_operation", { operation: "update", entityType: "Responsible", entityId: "Raul" }))).toBe(
      "sol editó el responsable Raul"
    )
  })

  it("describes users, searches, edits and sources", () => {
    expect(describeActivity(entry("user_operation", { operation: "create", target: "ana" }, "admin"))).toBe("admin creó el usuario ana")
    expect(describeActivity(entry("user_operation", { operation: "update", target: "ana", disabled: true }, "admin"))).toBe(
      "admin modificó el usuario ana (deshabilitado)"
    )
    expect(describeActivity(entry("cuit_search", { taxId: "30712345678", found: false }))).toBe("sol buscó el CUIT 30-71234567-8 (no encontrado)")
    expect(describeActivity(entry("name_search", { query: "acme", resultCount: 1 }))).toBe("sol buscó por nombre “acme” (1 resultado)")
    expect(describeActivity(entry("node_viewed", { taxId: "30712345678", businessName: "ACME", found: true }))).toBe(
      "sol abrió el CUIT 30-71234567-8 (ACME)"
    )
    expect(describeActivity(entry("node_updated", { taxId: "30712345678" }))).toBe("sol editó los datos del CUIT 30-71234567-8")
    expect(describeActivity(entry("source_rename_completed", { sourceName: "Bolsa" }, "admin"))).toBe("admin terminó de renombrar la fuente “Bolsa”")
    expect(describeActivity(entry("source_delete_failed", { sourceName: "Bolsa", error: "timeout" }, "admin"))).toBe(
      "admin falló al borrar la fuente “Bolsa”: timeout"
    )
    expect(describeActivity(entry("delete_level", { label: "Ignorar", affectedNodeCount: 2 }, "admin"))).toBe(
      "admin borró el nivel “Ignorar” (2 CUITs quedaron sin nivel)"
    )
    expect(describeActivity(entry("web_research", { taxId: "30712345678", status: "failed", costUsd: 0.1 }))).toBe(
      "sol investigó en la web el CUIT 30-71234567-8 y falló (US$ 0.1)"
    )
  })

  it("never leaves an unknown event blank", () => {
    expect(describeActivity(entry("something_new"))).toBe("sol: something_new")
  })
})

describe("activityCursor", () => {
  it("continues from the last entry shown, counting the ones that share its time", () => {
    const at = "2026-10-29T15:00:00.000Z"
    const entries = [entry("login"), { ...entry("logout"), time: at }, { ...entry("login"), time: at }]
    entries[0]!.time = "2026-10-29T16:00:00.000Z"
    expect(activityCursor(entries)).toEqual({ before: at, seen: 2 })
    expect(activityCursor([])).toBeUndefined()
  })

  it("names the new task outcomes", () => {
    expect(describeActivity(entry("crm_operation", { operation: "complete", entityType: "Task", description: "x", assignee: "Raul", dueDate: "2026-11-02", companyTaxId: "30712345678" }))).toMatch(/^sol completó la tarea/)
  })
})

describe("manual runs", () => {
  it("says a script was done by hand, in Spanish, with its arguments and outcome", () => {
    expect(
      describeActivity(entry("manual_run", { script: "crm:import", args: ["Listas.xlsx", "--by", "sol", "--apply"], status: "ok" }, "sol"))
    ).toBe("Se hizo a mano: importar empresas al CRM (Listas.xlsx --by sol --apply), terminó bien, por sol")
    expect(describeActivity(entry("manual_run", { script: "load:bolsa", args: [], status: "failed" }, null))).toBe(
      "Se hizo a mano: cargar la fuente Bolsa, falló"
    )
    expect(describeActivity(entry("manual_run", { script: "nuevo:script", args: [], status: "running" }, null))).toBe(
      "Se hizo a mano: nuevo:script, sin terminar"
    )
  })
})
