import { describe, it, expect } from "vitest"
import { parseCuitList, formatTaxId } from "@/lib/cuit"

describe("parseCuitList", () => {
  it("reads one CUIT per line", () => {
    expect(parseCuitList("20461235787\n30707505024").taxIds).toEqual(["20461235787", "30707505024"])
  })

  it("accepts commas as separators", () => {
    expect(parseCuitList("20461235787, 30707505024").taxIds).toHaveLength(2)
  })

  it("accepts semicolons and plain spaces", () => {
    expect(parseCuitList("20461235787; 30707505024 33708131879").taxIds).toHaveLength(3)
  })

  it("strips the dashes people paste from other systems", () => {
    expect(parseCuitList("20-46123578-7").taxIds).toEqual(["20461235787"])
  })

  it("strips dots as well", () => {
    expect(parseCuitList("20.46123578.7").taxIds).toEqual(["20461235787"])
  })

  it("keeps the order the CUITs were written in", () => {
    expect(parseCuitList("30707505024\n20461235787").taxIds).toEqual(["30707505024", "20461235787"])
  })

  it("drops a repeat rather than searching it twice", () => {
    expect(parseCuitList("20461235787\n20461235787").taxIds).toEqual(["20461235787"])
  })

  it("treats the dashed and bare spellings of one CUIT as the same", () => {
    expect(parseCuitList("20-46123578-7\n20461235787").taxIds).toHaveLength(1)
  })

  it("rejects anything that is not eleven digits", () => {
    expect(parseCuitList("hola").rejected).toEqual(["hola"])
  })

  it("rejects a CUIT that is one digit short", () => {
    const parsed = parseCuitList("2046123578")
    expect(parsed.taxIds).toEqual([])
    expect(parsed.rejected).toEqual(["2046123578"])
  })

  it("reports the rejected token as it was typed, not stripped", () => {
    expect(parseCuitList("20-461-235").rejected).toEqual(["20-461-235"])
  })

  it("keeps the good ones when some are bad", () => {
    const parsed = parseCuitList("20461235787\nhola\n30707505024")
    expect(parsed.taxIds).toHaveLength(2)
    expect(parsed.rejected).toEqual(["hola"])
  })

  it("returns nothing for an empty box", () => {
    expect(parseCuitList("")).toEqual({ taxIds: [], rejected: [] })
  })

  it("ignores blank lines and stray whitespace", () => {
    expect(parseCuitList("\n\n  20461235787  \n\n").taxIds).toEqual(["20461235787"])
  })
})

describe("formatTaxId", () => {
  it("groups the digits the way the rest of the app shows them", () => {
    expect(formatTaxId("20461235787")).toBe("20-46123578-7")
  })

  it("leaves anything that is not eleven digits alone", () => {
    expect(formatTaxId("2046")).toBe("2046")
  })
})
