import { describe, it, expect } from "vitest"
import { relationshipSummary } from "@/lib/relationships"

describe("relationshipSummary", () => {
  it("says how many of the relationships are with the known base", () => {
    expect(relationshipSummary(10, 1)).toBe("10 relaciones · 1 con base conocida")
  })

  it("shows zero with the known base too", () => {
    expect(relationshipSummary(2, 0)).toBe("2 relaciones · 0 con base conocida")
  })

  it("uses the singular for one", () => {
    expect(relationshipSummary(1, 1)).toBe("1 relación · 1 con base conocida")
  })

  it("drops the known base part when there are no relationships", () => {
    expect(relationshipSummary(0, 0)).toBe("0 relaciones")
  })
})
