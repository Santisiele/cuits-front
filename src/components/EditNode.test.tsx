import { describe, it, expect, beforeEach, vi } from "vitest"
import { act } from "react"
import { screen } from "@testing-library/react"
import { render } from "@/tests/render"
import type { NodeData } from "@/types"

let node: NodeData | undefined

vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }))

vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-query")>()),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}))

vi.mock("@/hooks/useGraphQueries", () => ({
  useNode: () => ({ data: node, isFetching: false, error: null }),
  useNodeRelationships: () => ({ data: null, isFetching: false, error: null }),
  useUpdateNode: () => ({ mutate: vi.fn(), isPending: false }),
  queryKeys: { node: (id: string) => ["node", id], nodeRelationships: (id: string, d: number) => ["nr", id, d] },
}))

vi.mock("@/hooks/useTrustLevels", () => ({
  useTrustLevels: () => ({ levels: [], labelFor: () => "Sin nivel", badgeClassFor: () => null, rowClassFor: () => "" }),
}))

vi.mock("@/components/GraphView", () => ({ GraphView: () => null }))
vi.mock("@/components/node-sources/EditNodeSourcesDialog", () => ({ EditNodeSourcesDialog: () => null }))

const { EditNode } = await import("@/components/EditNode")
const { useStore } = await import("@/store/useStore")

function debtor(overrides: Partial<NodeData> = {}): NodeData {
  return {
    taxId: "30501677643",
    businessName: "SANCOR COOPERATIVAS UNIDAS LIMITADA",
    phone: null,
    email: null,
    birthday: null,
    entryDate: null,
    exitDate: null,
    loadedAt: "11/09/2026",
    inMyBase: true,
    sources: ["Deudores por financiera"],
    financieraMonths: ["2026-05"],
    levelOfTrust: 0,
    trustReason: "",
    ...overrides,
  } as NodeData
}

function openNode(taxId: string): void {
  act(() => {
    useStore.getState().setEditTaxId(taxId)
  })
  render(<EditNode />)
}

describe("EditNode — lenders", () => {
  beforeEach(() => {
    act(() => {
      useStore.getState().setEditTaxId(null)
    })
  })

  it("shows the lenders of a debtor", () => {
    node = debtor({
      financieraLenders: [
        { entityName: "Cooperativa de Crédito y Vivienda Unicred Ltda.", operationCount: 1, totalLoan: 1680672000 },
        { entityName: "FINARES S.A.", operationCount: 1, totalLoan: 305522000 },
      ],
    })
    openNode("30501677643")
    expect(screen.getByText("Financieras a las que le pidió")).toBeInTheDocument()
    expect(screen.getByText("FINARES S.A.")).toBeInTheDocument()
    expect(screen.getByText("$ 1.680.672.000")).toBeInTheDocument()
  })

  it("shows no lender list for someone who is not a debtor", () => {
    node = debtor({ sources: ["Clientes CRM"], financieraMonths: [], financieraLenders: [] })
    openNode("30501677643")
    expect(screen.queryByText("Financieras a las que le pidió")).not.toBeInTheDocument()
  })

  it("copes with a node from before the API sent lenders", () => {
    node = debtor()
    openNode("30501677643")
    expect(screen.queryByText("Financieras a las que le pidió")).not.toBeInTheDocument()
  })
})
