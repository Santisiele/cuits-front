import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { act } from "react"
import { fireEvent, screen } from "@testing-library/react"
import { render } from "@/tests/render"
import type { NodeData } from "@/types"

let node: NodeData | undefined
const updateNode = vi.fn()

vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }))

vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-query")>()),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}))

vi.mock("@/hooks/useGraphQueries", () => ({
  useNode: () => ({ data: node, isFetching: false, error: null }),
  useNodeRelationships: () => ({ data: null, isFetching: false, error: null }),
  useUpdateNode: () => ({ mutate: vi.fn(), mutateAsync: updateNode, isPending: false }),
  queryKeys: { node: (id: string) => ["node", id], nodeRelationships: (id: string, d: number) => ["nr", id, d] },
}))

vi.mock("@/hooks/useTrustLevels", () => ({
  useTrustLevels: () => ({ levels: [], labelFor: () => "Sin nivel", badgeClassFor: () => null, rowClassFor: () => "" }),
}))

vi.mock("@/components/GraphView", () => ({ GraphView: () => null }))
vi.mock("@/components/node-sources/EditNodeSourcesDialog", () => ({ EditNodeSourcesDialog: () => null }))
vi.mock("@/components/research/WebResearchSection", () => ({
  WebResearchSection: ({ taxId }: { taxId: string }) => <p>Investigación web de {taxId}</p>,
}))

const { EditNode } = await import("@/components/EditNode")
const { useStore } = await import("@/store/useStore")
const { useAuthStore } = await import("@/store/useAuthStore")

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

describe("EditNode — admin actions", () => {
  beforeEach(() => {
    act(() => {
      useStore.getState().setEditTaxId(null)
    })
  })

  afterEach(() => {
    act(() => useAuthStore.getState().clearAuth())
  })

  it("does not offer a member to edit the sources", () => {
    act(() => useAuthStore.getState().setAuth("t1", "ana", "member"))
    node = debtor()
    openNode("30501677643")
    expect(screen.queryByRole("button", { name: "Editar fuentes" })).not.toBeInTheDocument()
    expect(screen.queryByText(/Investigación web/)).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Guardar" })).toBeInTheDocument()
  })

  it("offers an admin to edit the sources", () => {
    act(() => useAuthStore.getState().setAuth("t1", "santi", "admin"))
    node = debtor()
    openNode("30501677643")
    expect(screen.getByRole("button", { name: "Editar fuentes" })).toBeInTheDocument()
  })

  it("shows an admin the web research of the CUIT", () => {
    act(() => useAuthStore.getState().setAuth("t1", "santi", "admin"))
    node = debtor()
    openNode("30501677643")
    expect(screen.getByText("Investigación web de 30501677643")).toBeInTheDocument()
  })

  it("shows the creator the web research too", () => {
    act(() => useAuthStore.getState().setAuth("t1", "santi", "creator"))
    node = debtor()
    openNode("30501677643")
    expect(screen.getByText("Investigación web de 30501677643")).toBeInTheDocument()
  })
})

describe("EditNode — trust reason", () => {
  beforeEach(() => {
    updateNode.mockReset()
    act(() => {
      useStore.getState().setEditTaxId(null)
    })
  })

  it("saves a level without a reason", async () => {
    node = debtor({ levelOfTrust: 4, trustReason: "" })
    openNode("30501677643")

    expect(screen.getByPlaceholderText("Motivo (opcional)")).toBeInTheDocument()
    expect(screen.queryByText(/Poné el motivo/)).not.toBeInTheDocument()
    const save = screen.getByRole("button", { name: "Guardar" })
    expect(save).toBeEnabled()

    await act(async () => {
      fireEvent.click(save)
    })
    expect(updateNode).toHaveBeenCalledWith(expect.objectContaining({ levelOfTrust: 4, trustReason: "" }))
  })
})
