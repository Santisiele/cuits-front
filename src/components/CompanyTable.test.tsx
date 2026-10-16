import { describe, it, expect, beforeEach, vi } from "vitest"
import { act } from "react"
import { screen } from "@testing-library/react"
import { render } from "@/tests/render"
import type { BaseNode } from "@/types"

let rows: BaseNode[] = []

vi.mock("@/hooks/useGraphQueries", () => ({
  useCompanyNodes: () => ({ data: rows, isLoading: false, error: null }),
}))

vi.mock("@/hooks/useTrustLevels", () => ({
  useTrustLevelsQuery: () => ({ data: [{ value: 4, label: "Interesante", color: "green", description: "", nodeCount: 1 }] }),
  useTrustLevels: () => ({ levels: [], labelFor: () => "Sin nivel", badgeClassFor: () => null, rowClassFor: () => "" }),
}))

vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }))
vi.mock("@/lib/exportTable", () => ({ exportNodes: vi.fn() }))

const { CompanyTable } = await import("@/components/CompanyTable")
const { useStore } = await import("@/store/useStore")

function company(taxId: string, businessName: string, levelOfTrust: number): BaseNode {
  return { taxId, businessName, sources: [], relationshipCount: 1, levelOfTrust } as BaseNode
}

function show(hiddenTrustLevels: number[]): void {
  act(() => {
    useStore.getState().setCompanyTable({ search: "", selectedSources: [], hiddenTrustLevels, hiddenValues: {} })
  })
  render(<CompanyTable />)
}

describe("CompanyTable — filtering by trust level", () => {
  beforeEach(() => {
    rows = [company("30500010912", "ACME SA", 4), company("30711111119", "SIN NIVEL SRL", 0)]
  })

  it("offers the levels filter like the other tables", () => {
    show([])
    expect(screen.getByRole("button", { name: /Niveles/ })).toBeInTheDocument()
  })

  it("shows every company when no level is hidden", () => {
    show([])
    expect(screen.getByText("Empresas a buscar (2)")).toBeInTheDocument()
  })

  it("hides the companies of a hidden level and says how many are left", () => {
    show([4])
    expect(screen.getByText("Empresas a buscar (1 de 2)")).toBeInTheDocument()
    expect(screen.queryAllByText("ACME SA")).toHaveLength(0)
    expect(screen.getAllByText("SIN NIVEL SRL").length).toBeGreaterThan(0)
  })

  it("hides the companies without a level when that option is unticked", () => {
    show([0])
    expect(screen.queryAllByText("SIN NIVEL SRL")).toHaveLength(0)
    expect(screen.getAllByText("ACME SA").length).toBeGreaterThan(0)
  })
})
