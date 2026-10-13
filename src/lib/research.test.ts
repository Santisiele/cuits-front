import { describe, it, expect } from "vitest"
import {
  LIMIT_ERROR,
  archivedText,
  formatUsd,
  limitError,
  parseLimit,
  researchButtonLabel,
  researchCuit,
  spentShare,
} from "@/lib/research"

describe("formatUsd", () => {
  it("shows two decimals", () => {
    expect(formatUsd(0.1234)).toBe("US$ 0,12")
    expect(formatUsd(20)).toBe("US$ 20,00")
  })

  it("groups thousands", () => {
    expect(formatUsd(1234.5)).toBe("US$ 1.234,50")
  })
})

describe("parseLimit", () => {
  it("reads whole and decimal numbers", () => {
    expect(parseLimit("20")).toBe(20)
    expect(parseLimit(" 12.5 ")).toBe(12.5)
  })

  it("reads a decimal comma", () => {
    expect(parseLimit("12,5")).toBe(12.5)
  })

  it("accepts zero", () => {
    expect(parseLimit("0")).toBe(0)
  })

  it("rejects negatives, text and empty", () => {
    expect(parseLimit("-1")).toBeNull()
    expect(parseLimit("veinte")).toBeNull()
    expect(parseLimit("")).toBeNull()
    expect(parseLimit("1e3")).toBeNull()
  })
})

describe("limitError", () => {
  it("is null for a valid limit", () => {
    expect(limitError("15")).toBeNull()
  })

  it("explains an invalid limit", () => {
    expect(limitError("-3")).toBe(LIMIT_ERROR)
  })
})

describe("spentShare", () => {
  it("is the part of the limit already spent", () => {
    expect(spentShare(5, 20)).toBe(0.25)
  })

  it("never goes past the whole bar", () => {
    expect(spentShare(30, 20)).toBe(1)
  })

  it("never goes below empty", () => {
    expect(spentShare(-1, 20)).toBe(0)
  })

  it("fills the bar when the limit is zero and something was spent", () => {
    expect(spentShare(1, 0)).toBe(1)
  })

  it("leaves it empty when the limit is zero and nothing was spent", () => {
    expect(spentShare(0, 0)).toBe(0)
  })
})

describe("researchButtonLabel", () => {
  it("offers a first search", () => {
    expect(researchButtonLabel(0)).toBe("Buscar en la web")
  })

  it("offers to search again when there is history", () => {
    expect(researchButtonLabel(2)).toBe("Volver a buscar")
  })
})

describe("researchCuit", () => {
  it("drops the dashes", () => {
    expect(researchCuit("30-50167764-3")).toBe("30501677643")
  })
})

describe("archivedText", () => {
  it("says who archived it and when", () => {
    expect(archivedText("santi", "2026-10-13T15:00:00.000Z")).toBe("santi · 13/10/2026, 12:00")
  })

  it("keeps what it knows when a part is missing", () => {
    expect(archivedText(null, "2026-10-13T15:00:00.000Z")).toBe("13/10/2026, 12:00")
    expect(archivedText("santi", null)).toBe("santi")
  })

  it("shows a dash when nothing is known", () => {
    expect(archivedText(null, null)).toBe("—")
  })
})
