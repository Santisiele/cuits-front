import { describe, it, expect, beforeEach, vi } from "vitest"
import { act } from "react"
import { screen, fireEvent, within } from "@testing-library/react"
import { render } from "@/tests/render"
import type { CrossingNode } from "@/types"

let rows: CrossingNode[] = []

vi.mock("@/hooks/useGraphQueries", () => ({
  useCrossingNodes: () => ({ data: rows, isLoading: false, error: null }),
}))

vi.mock("@/hooks/useSourcesQuery", () => ({
  useSourcesQuery: () => ({
    data: [
      { name: "Bolsa", category: "to_know", nodeCount: 3 },
      { name: "Responsables Senior Home", category: "known", nodeCount: 3 },
    ],
  }),
}))

vi.mock("@/hooks/useTrustLevels", () => ({
  useTrustLevelsQuery: () => ({ data: [] }),
  useTrustLevels: () => ({ levels: [], labelFor: () => "Sin nivel", badgeClassFor: () => null, rowClassFor: () => "" }),
}))

vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }))
vi.mock("@/lib/exportTable", () => ({ exportNodes: vi.fn() }))

const { CrossingOverTable } = await import("@/components/CrossingOverTable")
const { useStore } = await import("@/store/useStore")

function node(taxId: string, businessName: string, sources: string[], indirectSources: string[] = []): CrossingNode {
  return { taxId, businessName, sources, indirectSources, relationshipCount: 0, levelOfTrust: 0 } as CrossingNode
}

function openSourceFilter(): HTMLElement {
  const header = screen.getByRole("columnheader", { name: /Fuentes/ })
  act(() => {
    fireEvent.click(within(header).getByRole("button", { name: "Filtrar Fuentes" }))
  })
  return screen.getByRole("dialog", { name: "Filtro de Fuentes" })
}

function untick(list: HTMLElement, label: string): void {
  act(() => {
    fireEvent.click(within(list).getByRole("button", { name: label }))
  })
}

describe("CrossingOverTable — filtering by source from the header", () => {
  beforeEach(() => {
    rows = [
      node("30111111118", "EMPRESA DIRECTA", ["Bolsa", "Responsables Senior Home"]),
      node("30222222224", "EMPRESA POR RELACION", ["Bolsa"], ["Responsables Senior Home"]),
    ]
    act(() => {
      useStore.getState().setCrossingOverTable({
        selectedSources: ["Bolsa", "Responsables Senior Home"],
        hiddenTrustLevels: [],
        hiddenValues: {},
        search: "",
      })
    })
    render(<CrossingOverTable />)
  })

  it("puts the filter beside the sort on the Fuentes header", () => {
    const header = screen.getByRole("columnheader", { name: /Fuentes/ })
    expect(within(header).getByRole("button", { name: "Filtrar Fuentes" })).toBeInTheDocument()
  })

  it("lists own sources first, then the ones reached by relation", () => {
    const labels = within(openSourceFilter()).getAllByRole("button").map((b) => b.textContent)
    expect(labels).toEqual(["Seleccionar todos", "Bolsa", "Responsables Senior Home", "↗ Responsables Senior Home"])
  })

  it("can hide the rows that only come in by relation", () => {
    const list = openSourceFilter()
    untick(list, "↗ Responsables Senior Home")
    untick(list, "Bolsa")
    expect(screen.queryAllByText("EMPRESA POR RELACION")).toHaveLength(0)
    expect(screen.getAllByText("EMPRESA DIRECTA").length).toBeGreaterThan(0)
  })

  it("keeps a row while one of its badges is still ticked", () => {
    untick(openSourceFilter(), "Responsables Senior Home")
    expect(screen.getAllByText("EMPRESA DIRECTA").length).toBeGreaterThan(0)
  })

  it("counts what the filter leaves against the crossing total", () => {
    const list = openSourceFilter()
    untick(list, "↗ Responsables Senior Home")
    untick(list, "Bolsa")
    expect(screen.getByText("Coincidencias (1 de 2)")).toBeInTheDocument()
  })

  it("remembers the filter in the store", () => {
    untick(openSourceFilter(), "Bolsa")
    expect(useStore.getState().crossingOverTable.hiddenValues.sources).toEqual(["Bolsa"])
  })
})
