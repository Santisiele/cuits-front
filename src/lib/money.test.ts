import { describe, it, expect } from "vitest"
import { formatPesos } from "@/lib/money"

describe("formatPesos", () => {
  it("groups thousands the Argentine way", () => {
    expect(formatPesos(1680672000)).toBe("$ 1.680.672.000")
  })

  it("leaves a small amount ungrouped", () => {
    expect(formatPesos(816)).toBe("$ 816")
  })

  it("shows zero as zero", () => {
    expect(formatPesos(0)).toBe("$ 0")
  })

  it("does not print decimals", () => {
    expect(formatPesos(2500.4)).toBe("$ 2.500")
  })
})
