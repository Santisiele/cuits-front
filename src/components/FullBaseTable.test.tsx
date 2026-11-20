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

describe("FullBaseTable — filtering Deudores por financiera by lender", () => {
  const FINANCIERA = "Deudores por financiera"
  const lenders = Array.from({ length: 9 }, (_, i) => `FINANCIERA ${i + 1} S.A.`)

  function lent(taxId: string, businessName: string, financieraNames: string[]): BaseNode {
    return { ...node(taxId, businessName, [FINANCIERA]), financieraNames }
  }

  function pick(source: string): void {
    act(() => {
      useStore.getState().setFullBaseTable({ selectedSources: [source], hiddenTrustLevels: [], hiddenValues: {}, search: "" })
    })
  }

  function openLenderFilter(): HTMLElement {
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /^Financieras/ }))
    })
    return screen.getByRole("dialog", { name: "Filtro de Financieras" })
  }

  beforeEach(() => {
    rows = [
      lent("30500000001", "UNO SA", [lenders[0]!, lenders[1]!]),
      lent("30500000002", "DOS SA", [lenders[1]!]),
      lent("30500000003", "TRES SA", lenders.slice(2)),
      lent("30500000004", "CUATRO SA", []),
    ]
  })

  it("only offers the lender filter for Deudores por financiera", () => {
    pick("Bolsa")
    render(<FullBaseTable />)
    expect(screen.queryByRole("button", { name: /^Financieras/ })).not.toBeInTheDocument()
  })

  it("lists every lender once, plus the rows without one", () => {
    pick(FINANCIERA)
    render(<FullBaseTable />)
    const labels = within(openLenderFilter()).getAllByRole("button").map((b) => b.textContent)
    expect(labels).toEqual(["Seleccionar todos", ...lenders, "(Sin financiera)"])
  })

  it("finds lenders with the search box", () => {
    pick(FINANCIERA)
    render(<FullBaseTable />)
    const list = openLenderFilter()
    act(() => {
      fireEvent.change(within(list).getByPlaceholderText("Buscar..."), { target: { value: "financiera 9" } })
    })
    const labels = within(list).getAllByRole("button").map((b) => b.textContent)
    expect(labels).toEqual(["Seleccionar todos", "FINANCIERA 9 S.A."])
  })

  it("keeps a CUIT while any of its lenders is ticked", () => {
    pick(FINANCIERA)
    render(<FullBaseTable />)
    const list = openLenderFilter()
    act(() => {
      fireEvent.click(within(list).getByRole("button", { name: "FINANCIERA 2 S.A." }))
    })
    expect(screen.getAllByText("UNO SA").length).toBeGreaterThan(0)
    expect(screen.queryAllByText("DOS SA")).toHaveLength(0)
    expect(screen.getByText(`${FINANCIERA} (3 de 4)`)).toBeInTheDocument()
    expect(useStore.getState().fullBaseTable.hiddenValues.financieras).toEqual(["FINANCIERA 2 S.A."])
  })

  it("ignores a lender filter left over once another source is picked", () => {
    act(() => {
      useStore.getState().setFullBaseTable({ selectedSources: ["Bolsa"], hiddenTrustLevels: [], hiddenValues: { financieras: lenders }, search: "" })
    })
    rows = [{ ...node("30500000009", "BOLSA SA", ["Bolsa"]), financieraNames: [lenders[0]!] }]
    render(<FullBaseTable />)
    expect(screen.getByText("Bolsa (1)")).toBeInTheDocument()
  })
})
