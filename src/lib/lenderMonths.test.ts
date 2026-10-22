import { describe, it, expect } from "vitest"
import { formatLenderPeriod, formatSituation } from "@/lib/lenderMonths"

describe("formatLenderPeriod", () => {
  it("names the month in Spanish with its year", () => {
    expect(formatLenderPeriod("2026-07")).toBe("Julio 2026")
  })

  it("says there is no date when the period is empty", () => {
    expect(formatLenderPeriod("")).toBe("Sin fecha")
  })

  it("shows an unexpected period as it came", () => {
    expect(formatLenderPeriod("2026-13")).toBe("2026-13")
  })
})

describe("formatSituation", () => {
  it("prefixes the situation number", () => {
    expect(formatSituation("3")).toBe("Situación 3")
  })

  it("says there is no situation when it is empty", () => {
    expect(formatSituation("")).toBe("Sin situación")
  })
})
