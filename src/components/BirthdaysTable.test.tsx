import { describe, it, expect, beforeEach, vi } from "vitest"
import { act } from "react"
import { screen, fireEvent } from "@testing-library/react"
import { render } from "@/tests/render"
import type { BirthdayNode, TrustLevelInfo } from "@/types"

const LEVELS: TrustLevelInfo[] = [
  { value: 1, label: "Alto", color: "green", description: "", nodeCount: 1 },
  { value: 2, label: "Bajo", color: "red", description: "", nodeCount: 1 },
]

let rows: BirthdayNode[] = []

vi.mock("@/hooks/useGraphQueries", () => ({
  useBirthdays: (_from: string, _to: string, enabled: boolean) => ({
    data: enabled ? rows : undefined,
    isFetching: false,
    error: null,
  }),
}))

vi.mock("@/hooks/useTrustLevels", () => ({
  useTrustLevelsQuery: () => ({ data: LEVELS }),
  useTrustLevels: () => ({
    levels: LEVELS,
    labelFor: (value: number | undefined) =>
      LEVELS.find((l) => l.value === value)?.label ?? "Sin nivel",
    badgeClassFor: (value: number | undefined) => (value ? "badge" : null),
    rowClassFor: () => "",
  }),
}))

vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }))
vi.mock("@/lib/exportTable", () => ({ exportNodes: vi.fn() }))

const { BirthdaysTable } = await import("@/components/BirthdaysTable")
const { useStore } = await import("@/store/useStore")

function node(taxId: string, businessName: string, levelOfTrust: number): BirthdayNode {
  return { taxId, businessName, birthday: "30/07/2004", sources: ["Poseidon"], relationshipCount: 0, levelOfTrust }
}

function dateInputs(): HTMLInputElement[] {
  return Array.from(document.querySelectorAll('input[type="date"]'))
}

function setRange(from: string, to: string): void {
  const [desde, hasta] = dateInputs()
  act(() => {
    fireEvent.change(desde!, { target: { value: from } })
    fireEvent.change(hasta!, { target: { value: to } })
  })
}

function buscar(): HTMLElement {
  return screen.getByRole("button", { name: "Buscar" })
}

describe("BirthdaysTable", () => {
  beforeEach(() => {
    rows = []
    act(() => {
      useStore.getState().setBirthdaysTable({ hiddenTrustLevels: [] })
    })
    render(<BirthdaysTable />)
  })

  describe("the date range", () => {
    it("opens on a range it will accept", () => {
      expect(buscar()).not.toBeDisabled()
    })

    it("refuses an end date before the start date", () => {
      setRange("2026-09-17", "2026-09-10")
      expect(buscar()).toBeDisabled()
    })

    it("says why it refuses it", () => {
      setRange("2026-09-17", "2026-09-10")
      expect(screen.getByText("La fecha de fin no puede ser anterior a la de inicio")).toBeInTheDocument()
    })

    it("still allows a range that wraps into the next year", () => {
      setRange("2026-12-20", "2027-01-05")
      expect(buscar()).not.toBeDisabled()
    })

    it("says nothing about a range that wraps the year", () => {
      setRange("2026-12-20", "2027-01-05")
      expect(screen.queryByText(/no puede ser anterior/)).not.toBeInTheDocument()
    })

    it("stops the search from being submitted while inverted", () => {
      setRange("2026-12-20", "2026-01-05")
      act(() => {
        fireEvent.click(buscar())
      })
      expect(screen.getByText(/Elegí un rango de fechas/)).toBeInTheDocument()
    })

    it("pins the end picker to the start date", () => {
      setRange("2026-09-17", "2026-10-17")
      expect(dateInputs()[1]!.min).toBe("2026-09-17")
    })
  })

  describe("the rows", () => {
    beforeEach(() => {
      rows = [node("20111111119", "Ana", 1), node("27222222224", "Beto", 2), node("20333333336", "Caro", 0)]
      act(() => {
        fireEvent.click(buscar())
      })
    })

    it("lists everyone in the range", () => {
      expect(screen.getAllByText("Ana").length).toBeGreaterThan(0)
      expect(screen.getAllByText("Beto").length).toBeGreaterThan(0)
      expect(screen.getAllByText("Caro").length).toBeGreaterThan(0)
    })

    it("renders each person in both the desktop table and the mobile list", () => {
      expect(screen.getAllByText("Ana")).toHaveLength(2)
    })

    it("counts them in the title", () => {
      expect(screen.getByText("Cumpleaños (3)")).toBeInTheDocument()
    })

    it("shows the trust level next to the name", () => {
      expect(screen.getAllByText("Alto").length).toBeGreaterThan(0)
    })

    it("offers the level filter", () => {
      expect(screen.getByRole("button", { name: /Niveles/ })).toBeInTheDocument()
    })
  })

  describe("filtering by trust level", () => {
    beforeEach(() => {
      rows = [node("20111111119", "Ana", 1), node("27222222224", "Beto", 2), node("20333333336", "Caro", 0)]
      act(() => {
        fireEvent.click(buscar())
      })
    })

    it("hides the rows of a level that was switched off", () => {
      act(() => {
        useStore.getState().setBirthdaysTable({ hiddenTrustLevels: [1] })
      })
      expect(screen.queryAllByText("Ana")).toHaveLength(0)
      expect(screen.getAllByText("Beto").length).toBeGreaterThan(0)
    })

    it("hides the ones with no level when Sin nivel is switched off", () => {
      act(() => {
        useStore.getState().setBirthdaysTable({ hiddenTrustLevels: [0] })
      })
      expect(screen.queryAllByText("Caro")).toHaveLength(0)
    })

    it("says how many of the total are showing", () => {
      act(() => {
        useStore.getState().setBirthdaysTable({ hiddenTrustLevels: [1] })
      })
      expect(screen.getByText("Cumpleaños (2 de 3)")).toBeInTheDocument()
    })

    it("goes back to the plain count when nothing is hidden", () => {
      act(() => {
        useStore.getState().setBirthdaysTable({ hiddenTrustLevels: [1] })
      })
      act(() => {
        useStore.getState().setBirthdaysTable({ hiddenTrustLevels: [] })
      })
      expect(screen.getByText("Cumpleaños (3)")).toBeInTheDocument()
    })

    it("says nobody is left when every level is hidden", () => {
      act(() => {
        useStore.getState().setBirthdaysTable({ hiddenTrustLevels: [0, 1, 2] })
      })
      expect(screen.getAllByText("Nadie cumple años en ese rango").length).toBeGreaterThan(0)
    })
  })
})
