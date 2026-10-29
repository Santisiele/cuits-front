import { describe, it, expect } from "vitest"
import {
  BIRTHDAY_ERROR,
  CANCEL_REASON_REQUIRED,
  CUIT_ERROR,
  DATE_ERROR,
  NAME_TOO_LONG,
  TASK_DESCRIPTION_REQUIRED,
  TEXT_TOO_LONG,
  birthdayError,
  buildTimeline,
  matchCompanies,
  canChangeAction,
  canChangeTask,
  cancelReasonError,
  cancelReasonLabel,
  cuitDigits,
  cuitError,
  dateError,
  describeChangeValue,
  formatDay,
  hasErrors,
  optionalNameError,
  optionalText,
  removalText,
  requiredTextError,
  taskDraftErrors,
  todayInBuenosAires,
  userColor,
} from "@/lib/crm"
import { USER_COLOR_KEYS } from "@/lib/userColors"
import type { CrmAction, CrmTask } from "@/types"

const TASK: CrmTask = {
  id: "t1",
  companyTaxId: "30712345678",
  description: "Llamar",
  dueDate: "2026-10-30",
  status: "open",
  cancelReason: null,
  assignee: "Flavia",
  createdBy: "santi",
  contactIds: [],
  createdAt: "",
  closedAt: null,
  archivedAt: null,
}

const ACTION: CrmAction = {
  id: "a1",
  companyTaxId: "30712345678",
  date: "2026-10-29",
  description: "Lo llamé",
  doneBy: "flavia",
  contactIds: [],
  createdTaskId: null,
  completedTaskIds: [],
  createdAt: "",
  archivedAt: null,
}

describe("the same checks the API makes", () => {
  it("wants 11 digits for a CUIT, dashes allowed", () => {
    expect(cuitError("30-71234567-8")).toBeNull()
    expect(cuitDigits("30-71234567-8")).toBe("30712345678")
    expect(cuitError("3071234567")).toBe(CUIT_ERROR)
  })

  it("wants a real day for a date", () => {
    expect(dateError("2026-10-29")).toBeNull()
    expect(dateError("2026-02-30")).toBe(DATE_ERROR)
    expect(dateError("")).toBe(DATE_ERROR)
  })

  it("takes an empty birthday or a real dd/mm/yyyy one", () => {
    expect(birthdayError("")).toBeNull()
    expect(birthdayError("06/05/1980")).toBeNull()
    expect(birthdayError("31/04/1980")).toBe(BIRTHDAY_ERROR)
    expect(birthdayError("1980-05-06")).toBe(BIRTHDAY_ERROR)
  })

  it("requires text and caps its length", () => {
    expect(requiredTextError("  ", "Falta")).toBe("Falta")
    expect(requiredTextError("x".repeat(2001), "Falta")).toBe(TEXT_TOO_LONG)
    expect(requiredTextError("x".repeat(201), "Falta", 200)).toBe(NAME_TOO_LONG)
    expect(requiredTextError("ok", "Falta")).toBeNull()
    expect(optionalNameError("x".repeat(201))).toBe(NAME_TOO_LONG)
    expect(optionalNameError("")).toBeNull()
  })

  it("needs a reason to cancel", () => {
    expect(cancelReasonError(" ")).toBe(CANCEL_REASON_REQUIRED)
    expect(cancelReasonError("Ya no compra")).toBeNull()
  })

  it("checks a task draft", () => {
    const errors = taskDraftErrors({ description: "", dueDate: "x", assignee: "santi", contactIds: [] })
    expect(errors).toEqual({ description: TASK_DESCRIPTION_REQUIRED, dueDate: DATE_ERROR })
    expect(hasErrors(errors)).toBe(true)
    expect(hasErrors(taskDraftErrors({ description: "Llamar", dueDate: "2026-11-02", assignee: "", contactIds: [] }))).toBe(false)
  })
})

describe("display helpers", () => {
  it("sends blank text as null", () => {
    expect(optionalText("  ")).toBeNull()
    expect(optionalText(" Acme ")).toBe("Acme")
  })

  it("takes today in Buenos Aires, not UTC", () => {
    expect(todayInBuenosAires(new Date("2026-10-30T02:59:00.000Z"))).toBe("2026-10-29")
    expect(todayInBuenosAires(new Date("2026-10-30T03:00:00.000Z"))).toBe("2026-10-30")
  })

  it("shows days as dd/mm/yyyy", () => {
    expect(formatDay("2026-10-29")).toBe("29/10/2026")
    expect(formatDay(null)).toBe("—")
    expect(formatDay("raro")).toBe("raro")
  })

  it("explains what removing a company does", () => {
    expect(removalText({ outcome: "deleted", cancelledTaskCount: 0, dryRun: true })).toMatch(/se borra de la base/)
    expect(removalText({ outcome: "unlinked", cancelledTaskCount: 0, dryRun: true })).toMatch(/queda en la base/)
    expect(removalText({ outcome: "archived", cancelledTaskCount: 1, dryRun: true })).toMatch(/Se cancela su tarea abierta/)
    expect(removalText({ outcome: "archived", cancelledTaskCount: 3, dryRun: true })).toMatch(/Se cancelan sus 3 tareas abiertas/)
  })

  it("translates the automatic cancel reason", () => {
    expect(cancelReasonLabel("company_removed")).toBe("La empresa salió del CRM")
    expect(cancelReasonLabel("Ya no compra")).toBe("Ya no compra")
    expect(cancelReasonLabel(null)).toBe("")
  })

  it("describes history values in Spanish", () => {
    expect(describeChangeValue(null)).toBe("—")
    expect(describeChangeValue([])).toBe("—")
    expect(describeChangeValue(["c1", "c2"], { c1: "Ana" })).toBe("Ana, c2")
    expect(describeChangeValue(true)).toBe("Sí")
    expect(describeChangeValue("done")).toBe("Hecha")
    expect(describeChangeValue("company_removed")).toBe("La empresa salió del CRM")
    expect(describeChangeValue("2026-11-02")).toBe("02/11/2026")
    expect(describeChangeValue(4)).toBe("4")
  })
})

describe("userColor", () => {
  const users = [
    { username: "Flavia", color: "teal" },
    { username: "raul", color: null },
    { username: "mati", color: "#ff0000" },
    { username: "ana", color: null },
  ]

  it("uses the color an admin picked, whatever the case of the name", () => {
    expect(userColor("flavia", users)).toBe("teal")
  })

  it("gives everyone else a different color, skipping the ones already picked", () => {
    const derived = ["ana", "mati", "raul"].map((name) => userColor(name, users))
    expect(new Set(derived).size).toBe(3)
    expect(derived).not.toContain("teal")
    expect(userColor("RAUL", users)).toBe(userColor("raul", users))
  })

  it("still answers for someone missing from the list", () => {
    expect(USER_COLOR_KEYS).toContain(userColor("nadie", users))
  })
})

describe("buildTimeline", () => {
  const task = (id: string, status: CrmTask["status"], closedAt: string | null = null): CrmTask => ({ ...TASK, id, status, closedAt })
  const action = (id: string, date: string, completedTaskIds: string[], createdTaskId: string | null): CrmAction => ({
    ...ACTION,
    id,
    date,
    completedTaskIds,
    createdTaskId,
  })

  it("puts fulfilled tasks under the action that fulfilled them instead of on the closing day", () => {
    const tasks = [task("t1", "done", "2026-10-29T12:00:00.000Z"), task("t2", "open")]
    const entries = buildTimeline([action("a1", "2026-10-20", ["t1"], "t2")], tasks)
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({ kind: "action", day: "2026-10-20", fulfilled: [{ id: "t1" }], next: { id: "t2" } })
  })

  it("keeps tasks closed by hand as entries of their own, newest first", () => {
    const tasks = [task("t1", "cancelled", "2026-10-25T12:00:00.000Z"), task("t2", "done", "2026-10-21T12:00:00.000Z")]
    const entries = buildTimeline([action("a1", "2026-10-22", [], null)], tasks)
    expect(entries.map((entry) => entry.day)).toEqual(["2026-10-25", "2026-10-22", "2026-10-21"])
  })
})

describe("matchCompanies", () => {
  const companies = [
    { taxId: "30712345678", businessName: "Acmé SA" },
    { taxId: "30798765432", businessName: "Zeta SA" },
    { taxId: "30711111111", businessName: "Acme Norte SA" },
  ]

  it("finds by name ignoring case and accents, sorted", () => {
    expect(matchCompanies(companies, "ACME").map((company) => company.businessName)).toEqual(["Acme Norte SA", "Acmé SA"])
  })

  it("finds by part of the CUIT, dashes allowed", () => {
    expect(matchCompanies(companies, "30-7987").map((company) => company.taxId)).toEqual(["30798765432"])
  })

  it("shows nothing until something is typed, and caps the list", () => {
    expect(matchCompanies(companies, " ")).toEqual([])
    expect(matchCompanies(companies, "sa", 2)).toHaveLength(2)
  })
})

describe("who may change what, mirroring the API", () => {
  it("lets admins change anything", () => {
    expect(canChangeTask("pedro", true, TASK)).toBe(true)
    expect(canChangeAction("pedro", true, ACTION)).toBe(true)
  })

  it("lets a member change tasks they created or hold, and their own actions", () => {
    expect(canChangeTask("flavia", false, TASK)).toBe(true)
    expect(canChangeTask("Santi", false, TASK)).toBe(true)
    expect(canChangeTask("pedro", false, TASK)).toBe(false)
    expect(canChangeTask(null, false, TASK)).toBe(false)
    expect(canChangeAction("FLAVIA", false, ACTION)).toBe(true)
    expect(canChangeAction("pedro", false, ACTION)).toBe(false)
  })
})
