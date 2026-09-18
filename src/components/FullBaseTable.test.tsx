import { describe, it, expect, beforeEach, vi } from "vitest"
import { act } from "react"
import { screen, fireEvent, within } from "@testing-library/react"
import { render } from "@/tests/render"
import type { BaseNode } from "@/types"

let rows: BaseNode[] = []

vi.mock("@/hooks/useGraphQueries", () => ({
  useFullBaseNodes: (source: string | null) => ({
    data: source ? rows : [],
    isLoading: false,
    error: null,
  }),
}))

vi.mock("@/hooks/useSourcesQuery", () => ({
  useSourceCategoryMap: () => new Map([["Bolsa", "to_know"], ["Poseidon", "known"]]),
}))

vi.mock("@/hooks/useTrustLevels", () => ({
  useTrustLevelsQuery: () => ({ data: [] }),
  useTrustLevels: () => ({ levels: [], labelFor: () => "Sin nivel", badgeClassFor: () => null, rowClassFor: () => "" }),
}))

vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }))
vi.mock("@/lib/exportTable", () => ({ exportNodes: vi.fn() }))

const { FullBaseTable } = await import("@/components/FullBaseTable")
const { useStore } = await import("@/store/useStore")

function node(taxId: string, businessName: string, sources: string[]): BaseNode {
  return { taxId, businessName, sources, relationshipCount: 0, levelOfTrust: 0 } as BaseNode
}

function openSourceFilter(): HTMLElement {
  const header = screen.getByRole("columnheader", { name: /Fuentes/ })
  act(() => {
    fireEvent.click(within(header).getByRole("button", { name: "Filtrar Fuentes" }))
  })
  return screen.getByRole("dialog", { name: "Filtro de Fuentes" })
}

describe("FullBaseTable — filtering by source from the header", () => {
  beforeEach(() => {
    rows = [
      node("30502793175", "ARCOR S A I C", ["Bolsa", "Deudores por financiera"]),
      node("30521944214", "CHEMOTECNICA S. A.", ["Bolsa"]),
      node("30660920451", "GRUAS SAN BLAS", ["Bolsa", "Clientes CRM"]),
    ]
    act(() => {
      useStore.getState().setFullBaseTable({
        selectedSources: ["Bolsa"],
        hiddenTrustLevels: [],
        hiddenValues: {},
        search: "",
      })
    })
    render(<FullBaseTable />)
  })

  it("puts the filter beside the sort on the Fuentes header", () => {
    const header = screen.getByRole("columnheader", { name: /Fuentes/ })
    expect(within(header).getByRole("button", { name: "Filtrar Fuentes" })).toBeInTheDocument()
  })

  it("still sorts when the column name is touched", () => {
    const header = screen.getByRole("columnheader", { name: /Fuentes/ })
    act(() => {
      fireEvent.click(within(header).getByRole("button", { name: /^Fuentes/ }))
    })
    expect(useStore.getState().fullBaseTable.sortField).toBe("sources")
  })

  it("lists every source the rows carry", () => {
    const labels = within(openSourceFilter()).getAllByRole("button").map((b) => b.textContent)
    expect(labels).toEqual(["Seleccionar todos", "Bolsa", "Clientes CRM", "Deudores por financiera"])
  })

  it("keeps rows that still have a source switched on", () => {
    const list = openSourceFilter()
    act(() => {
      fireEvent.click(within(list).getByRole("button", { name: "Clientes CRM" }))
    })
    expect(screen.getAllByText("GRUAS SAN BLAS").length).toBeGreaterThan(0)
  })

  it("hides rows once none of their sources is switched on", () => {
    const list = openSourceFilter()
    act(() => {
      fireEvent.click(within(list).getByRole("button", { name: "Bolsa" }))
    })
    expect(screen.queryAllByText("CHEMOTECNICA S. A.")).toHaveLength(0)
    expect(screen.getAllByText("ARCOR S A I C").length).toBeGreaterThan(0)
  })

  it("counts what the filter leaves against the source total", () => {
    const list = openSourceFilter()
    act(() => {
      fireEvent.click(within(list).getByRole("button", { name: "Bolsa" }))
    })
    expect(screen.getByText("Bolsa (2 de 3)")).toBeInTheDocument()
  })

  it("remembers the filter in the store", () => {
    const list = openSourceFilter()
    act(() => {
      fireEvent.click(within(list).getByRole("button", { name: "Bolsa" }))
    })
    expect(useStore.getState().fullBaseTable.hiddenValues.sources).toEqual(["Bolsa"])
  })
})
