import { describe, it, expect, beforeEach, vi } from "vitest"
import { act } from "react"
import { screen, fireEvent } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { render } from "@/tests/render"
import type { TrustLevelMember, TrustLevelMembersResponse } from "@/types"

interface FakeQuery {
  data?: TrustLevelMembersResponse
  error?: Error | null
  isLoading: boolean
}

let answer: FakeQuery = { isLoading: false }
const askedFor: (number | null)[] = []

vi.mock("@/hooks/useTrustLevels", () => ({
  useTrustLevelMembers: (value: number | null) => {
    askedFor.push(value)
    return value === null ? { isLoading: false } : answer
  },
}))

vi.mock("@/lib/exportTable", () => ({ exportNodes: vi.fn() }))

const { TrustLevelMembersTable } = await import("@/components/TrustLevelMembersTable")

function member(taxId: string, businessName: string, trustReason = ""): TrustLevelMember {
  return { taxId, businessName, sources: ["Bolsa"], relationshipCount: 2, isKnown: false, isToKnow: true, trustReason }
}

function loaded(members: TrustLevelMember[], description = "Vale la pena"): FakeQuery {
  return {
    isLoading: false,
    data: {
      level: { value: 4, label: "Interesante", color: "green", description, nodeCount: members.length },
      members,
    },
  }
}

function open(path: string): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/trust-levels/:value" element={<TrustLevelMembersTable />} />
      </Routes>
    </MemoryRouter>
  )
}

function type(text: string): void {
  act(() => {
    fireEvent.change(screen.getByPlaceholderText("Buscar por nombre o CUIT..."), { target: { value: text } })
  })
}

describe("TrustLevelMembersTable", () => {
  beforeEach(() => {
    answer = { isLoading: false }
    askedFor.length = 0
  })

  describe("a level with CUITs", () => {
    beforeEach(() => {
      answer = loaded([
        member("30500904557", "CHAMMAS SOC RESP LTDA", "de cordoba, cheques de primera"),
        member("30714208671", "CLEANPACK SRL"),
      ])
      open("/trust-levels/4")
    })

    it("asks for the level in the address", () => {
      expect(askedFor).toContain(4)
    })

    it("titles the list with the level and how many CUITs it has", () => {
      expect(screen.getByText("Interesante (2)")).toBeInTheDocument()
    })

    it("shows what the level is for", () => {
      expect(screen.getByText("Vale la pena")).toBeInTheDocument()
    })

    it("lists every CUIT at the level", () => {
      expect(screen.getAllByText("CHAMMAS SOC RESP LTDA").length).toBeGreaterThan(0)
      expect(screen.getAllByText("CLEANPACK SRL").length).toBeGreaterThan(0)
    })

    it("shows the reason each CUIT was given the level", () => {
      expect(screen.getAllByText("de cordoba, cheques de primera").length).toBeGreaterThan(0)
    })

    it("says so when a CUIT was given the level without a reason", () => {
      expect(screen.getAllByText("Sin motivo").length).toBeGreaterThan(0)
    })

    it("links back to the list of levels", () => {
      expect(screen.getByRole("link", { name: /Niveles de confianza/ })).toHaveAttribute("href", "/trust-levels")
    })

    it("narrows the list by name", () => {
      type("chammas")
      expect(screen.queryAllByText("CLEANPACK SRL")).toHaveLength(0)
      expect(screen.getAllByText("CHAMMAS SOC RESP LTDA").length).toBeGreaterThan(0)
    })

    it("narrows the list by CUIT, dashes and all", () => {
      type("30-71420")
      expect(screen.queryAllByText("CHAMMAS SOC RESP LTDA")).toHaveLength(0)
      expect(screen.getAllByText("CLEANPACK SRL").length).toBeGreaterThan(0)
    })

    it("says how many of the total match the search", () => {
      type("chammas")
      expect(screen.getByText("Interesante (1 de 2)")).toBeInTheDocument()
    })

    it("says so when nothing matches the search", () => {
      type("no existe")
      expect(screen.getAllByText("Ningún CUIT de este nivel coincide con la búsqueda").length).toBeGreaterThan(0)
    })
  })

  describe("a level nobody has", () => {
    it("says so instead of drawing an empty table", () => {
      answer = loaded([])
      open("/trust-levels/4")
      expect(screen.getByText("Ningún CUIT tiene este nivel todavía.")).toBeInTheDocument()
    })

    it("does not offer to search or export an empty list", () => {
      answer = loaded([])
      open("/trust-levels/4")
      expect(screen.queryByPlaceholderText("Buscar por nombre o CUIT...")).not.toBeInTheDocument()
      expect(screen.queryByRole("button", { name: "CSV" })).not.toBeInTheDocument()
    })
  })

  describe("an address that is not a level", () => {
    it("refuses text without asking the API", () => {
      open("/trust-levels/alto")
      expect(screen.getByText("Nivel inválido")).toBeInTheDocument()
      expect(askedFor.every((value) => value === null)).toBe(true)
    })

    it("refuses level 0 without asking the API", () => {
      open("/trust-levels/0")
      expect(screen.getByText("Nivel inválido")).toBeInTheDocument()
      expect(askedFor.every((value) => value === null)).toBe(true)
    })

    it("still offers the way back", () => {
      open("/trust-levels/alto")
      expect(screen.getByRole("link", { name: /Niveles de confianza/ })).toBeInTheDocument()
    })
  })

  describe("when the API answers with an error", () => {
    it("shows what went wrong", () => {
      answer = { isLoading: false, error: new Error("Ese nivel no existe") }
      open("/trust-levels/99")
      expect(screen.getByText("Ese nivel no existe")).toBeInTheDocument()
    })
  })
})
