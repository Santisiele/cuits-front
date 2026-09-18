import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { render } from "@/tests/render"
import type { TrustLevelInfo } from "@/types"

let levels: TrustLevelInfo[] = []

vi.mock("@/hooks/useTrustLevels", () => ({
  useTrustLevelsQuery: () => ({ data: levels, isLoading: false, error: null }),
  useTrustLevelMutations: () => ({}),
}))

const { TrustLevelsTable } = await import("@/components/TrustLevelsTable")

function level(value: number, label: string, nodeCount: number): TrustLevelInfo {
  return { value, label, color: "green", description: "", nodeCount }
}

function show(): void {
  render(
    <MemoryRouter>
      <TrustLevelsTable />
    </MemoryRouter>
  )
}

describe("TrustLevelsTable", () => {
  beforeEach(() => {
    levels = [level(1, "Inservible", 14), level(3, "Frio", 1), level(8, "Nuevo", 0)]
    show()
  })

  it("offers a way into each level that has CUITs", () => {
    expect(screen.getByRole("link", { name: /Ver 14 CUITs/ })).toHaveAttribute("href", "/trust-levels/1")
  })

  it("points each link at its own level", () => {
    expect(screen.getByRole("link", { name: /Ver 1 CUIT/ })).toHaveAttribute("href", "/trust-levels/3")
  })

  it("uses the singular for a level with one CUIT", () => {
    expect(screen.getByRole("link", { name: /Ver 1 CUIT$/ })).toBeInTheDocument()
  })

  it("does not link a level nobody has", () => {
    expect(screen.getByText("Sin CUITs")).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /Ver 0/ })).not.toBeInTheDocument()
  })

  it("offers exactly one link per level with CUITs", () => {
    expect(screen.getAllByRole("link")).toHaveLength(2)
  })
})
