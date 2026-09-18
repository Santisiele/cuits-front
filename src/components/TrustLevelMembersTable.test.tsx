import { describe, it, expect, beforeEach, vi } from "vitest"
import { act } from "react"
import { screen, fireEvent } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { render } from "@/tests/render"
import type { TrustLevelInfo, TrustLevelMember, TrustLevelMembersResponse } from "@/types"

interface FakeQuery {
  data?: TrustLevelMembersResponse
  error?: Error | null
  isLoading: boolean
}

let answer: FakeQuery = { isLoading: false }
let knownLevels: TrustLevelInfo[] | undefined = undefined
const askedFor: (number | null)[] = []

vi.mock("@/hooks/useTrustLevels", () => ({
  useTrustLevelMembers: (value: number | null) => {
    askedFor.push(value)
    return value === null ? { isLoading: false } : answer
  },
  useTrustLevelsQuery: () => ({ data: knownLevels }),
}))

vi.mock("@/lib/exportTable", () => ({ exportNodes: vi.fn() }))

const { TrustLevelMembersTable } = await import("@/components/TrustLevelMembersTable")
const { exportNodes } = await import("@/lib/exportTable")
const { useStore } = await import("@/store/useStore")

function expectNoLevelIdOnScreen(): void {
  expect(document.body.textContent).not.toMatch(/Nivel \d/)
}

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
        <Route path="/edit" element={<p>pantalla de edición</p>} />
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
    knownLevels = undefined
    askedFor.length = 0
    vi.mocked(exportNodes).mockClear()
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

    it("opens a CUIT for editing when its name is clicked", () => {
      act(() => {
        fireEvent.click(screen.getAllByText("CHAMMAS SOC RESP LTDA")[0]!)
      })
      expect(screen.getByText("pantalla de edición")).toBeInTheDocument()
      expect(useStore.getState().editTaxId).toBe("30500904557")
    })

    it("opens a CUIT for editing when its number is clicked", () => {
      act(() => {
        fireEvent.click(screen.getAllByText("30714208671")[0]!)
      })
      expect(useStore.getState().editTaxId).toBe("30714208671")
    })

    it("names the exported file after the level, not its number", () => {
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: "CSV" }))
      })
      expect(vi.mocked(exportNodes).mock.calls[0]![2]).toBe("nivel-interesante")
    })

    it("says so when nothing matches the search", () => {
      type("no existe")
      expect(screen.getAllByText("Ningún CUIT de este nivel coincide con la búsqueda").length).toBeGreaterThan(0)
    })
  })

  describe("while the list is loading", () => {
    it("never shows the level number in place of its name", () => {
      answer = { isLoading: true }
      open("/trust-levels/4")
      expectNoLevelIdOnScreen()
    })

    it("uses a neutral title when the name is not known yet", () => {
      answer = { isLoading: true }
      open("/trust-levels/4")
      expect(screen.getByText("Nivel de confianza")).toBeInTheDocument()
    })

    it("shows the name at once when the levels screen already loaded it", () => {
      answer = { isLoading: true }
      knownLevels = [{ value: 4, label: "Interesante", color: "green", description: "Vale la pena", nodeCount: 2 }]
      open("/trust-levels/4")
      expect(screen.getByText("Interesante")).toBeInTheDocument()
      expect(screen.getByText("Vale la pena")).toBeInTheDocument()
    })

    it("does not borrow another level's name from the cache", () => {
      answer = { isLoading: true }
      knownLevels = [{ value: 3, label: "Frio", color: "red", description: "", nodeCount: 1 }]
      open("/trust-levels/4")
      expect(screen.queryByText("Frio")).not.toBeInTheDocument()
    })

    it("holds back the count until the list arrives", () => {
      answer = { isLoading: true }
      knownLevels = [{ value: 4, label: "Interesante", color: "green", description: "", nodeCount: 2 }]
      open("/trust-levels/4")
      expect(screen.queryByText(/Interesante \(/)).not.toBeInTheDocument()
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

    it("does not repeat back what was typed in the address", () => {
      open("/trust-levels/0")
      expect(document.body.textContent).not.toMatch(/"0"/)
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

    it("does not fall back to showing the level number", () => {
      answer = { isLoading: false, error: new Error("Ese nivel no existe") }
      open("/trust-levels/99")
      expectNoLevelIdOnScreen()
    })
  })
})
