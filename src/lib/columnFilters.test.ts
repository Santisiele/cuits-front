import { describe, it, expect } from "vitest"
import {
  EMPTY_VALUE,
  matchesOptionSearch,
  optionsFrom,
  passesFilter,
  toggleAll,
  toggleValue,
} from "@/lib/columnFilters"

interface Row {
  sources: string[]
}

const rows: Row[] = [
  { sources: ["Bolsa", "Clientes CRM"] },
  { sources: ["Bolsa"] },
  { sources: ["Deudores por financiera"] },
  { sources: [] },
]

describe("optionsFrom", () => {
  it("lists every distinct value once, alphabetically", () => {
    expect(optionsFrom(rows, (r) => r.sources).map((o) => o.label)).toEqual([
      "Bolsa",
      "Clientes CRM",
      "Deudores por financiera",
      "(Vacías)",
    ])
  })

  it("offers the empty option last, only when some row is empty", () => {
    expect(optionsFrom(rows.slice(0, 3), (r) => r.sources).some((o) => o.value === EMPTY_VALUE)).toBe(false)
  })

  it("names the empty option as asked", () => {
    const options = optionsFrom(rows, (r) => r.sources, { emptyLabel: "Sin motivo" })
    expect(options[options.length - 1]).toEqual({ value: EMPTY_VALUE, label: "Sin motivo" })
  })

  it("follows a given order instead of the alphabet", () => {
    const months = [{ m: ["Marzo"] }, { m: ["Enero"] }]
    expect(optionsFrom(months, (r) => r.m, { order: ["Enero", "Febrero", "Marzo"] }).map((o) => o.label)).toEqual([
      "Enero",
      "Marzo",
    ])
  })

  it("treats blank and padded values as the same value", () => {
    const options = optionsFrom([{ s: [" Bolsa "] }, { s: ["Bolsa"] }, { s: ["  "] }], (r) => r.s)
    expect(options.map((o) => o.label)).toEqual(["Bolsa", "(Vacías)"])
  })

  it("sorts accents the Spanish way", () => {
    const options = optionsFrom([{ s: ["Ñandú"] }, { s: ["Nube"] }, { s: ["Oso"] }], (r) => r.s)
    expect(options.map((o) => o.label)).toEqual(["Nube", "Ñandú", "Oso"])
  })

  it("returns nothing for no rows", () => {
    expect(optionsFrom([], (r: Row) => r.sources)).toEqual([])
  })
})

describe("passesFilter", () => {
  it("lets everything through while nothing is hidden", () => {
    expect(passesFilter(["Bolsa"], new Set())).toBe(true)
  })

  it("hides a row whose only value is hidden", () => {
    expect(passesFilter(["Bolsa"], new Set(["Bolsa"]))).toBe(false)
  })

  it("keeps a row while any of its values is still shown", () => {
    expect(passesFilter(["Bolsa", "Clientes CRM"], new Set(["Bolsa"]))).toBe(true)
  })

  it("hides a row once all of its values are hidden", () => {
    expect(passesFilter(["Bolsa", "Clientes CRM"], new Set(["Bolsa", "Clientes CRM"]))).toBe(false)
  })

  it("hides an empty row when the empty option is off", () => {
    expect(passesFilter([], new Set([EMPTY_VALUE]))).toBe(false)
  })

  it("keeps an empty row when only real values are off", () => {
    expect(passesFilter([], new Set(["Bolsa"]))).toBe(true)
  })

  it("reads a blank value as empty", () => {
    expect(passesFilter([" "], new Set([EMPTY_VALUE]))).toBe(false)
  })
})

describe("toggleValue", () => {
  it("hides a shown value", () => {
    expect(toggleValue([], "Bolsa")).toEqual(["Bolsa"])
  })

  it("shows a hidden value again", () => {
    expect(toggleValue(["Bolsa", "CRM"], "Bolsa")).toEqual(["CRM"])
  })
})

describe("toggleAll", () => {
  const options = [
    { value: "A", label: "A" },
    { value: "B", label: "B" },
  ]

  it("unticks everything when everything is ticked", () => {
    expect(toggleAll([], options).sort()).toEqual(["A", "B"])
  })

  it("ticks everything back when something is unticked", () => {
    expect(toggleAll(["A"], options)).toEqual([])
  })

  it("only touches the options the search is showing", () => {
    expect(toggleAll(["Z"], [{ value: "A", label: "A" }]).sort()).toEqual(["A", "Z"])
  })

  it("leaves hidden values outside the search alone when ticking back", () => {
    expect(toggleAll(["A", "Z"], [{ value: "A", label: "A" }])).toEqual(["Z"])
  })
})

describe("matchesOptionSearch", () => {
  const option = { value: "x", label: "FINARES S.A." }

  it("matches regardless of case", () => {
    expect(matchesOptionSearch(option, "finares")).toBe(true)
  })

  it("matches anything while the search is blank", () => {
    expect(matchesOptionSearch(option, "  ")).toBe(true)
  })

  it("rejects a label that does not contain the search", () => {
    expect(matchesOptionSearch(option, "marias")).toBe(false)
  })
})
