import { describe, it, expect, vi } from "vitest"
import { act } from "react"
import { screen, fireEvent } from "@testing-library/react"
import { render } from "@/tests/render"
import type { TrustLevelInfo } from "@/types"

const LEVELS: TrustLevelInfo[] = [
  { value: 1, label: "Inservible", color: "red", description: "", nodeCount: 14 },
  { value: 4, label: "Interesante", color: "green", description: "", nodeCount: 2 },
]

vi.mock("@/hooks/useTrustLevels", () => ({
  useTrustLevelsQuery: () => ({ data: LEVELS }),
}))

const { TrustLevelFilter } = await import("@/components/TrustLevelFilter")

function click(element: Element): void {
  act(() => {
    fireEvent.click(element)
  })
}

describe("TrustLevelFilter", () => {
  it("lists Sin nivel first, then every level", () => {
    render(<TrustLevelFilter hidden={[]} onChange={vi.fn()} />)
    click(screen.getByRole("button", { name: /Niveles/ }))
    const labels = screen.getAllByRole("button").map((b) => b.textContent)
    expect(labels).toEqual(expect.arrayContaining(["Sin nivel", "Inservible", "Interesante"]))
    expect(labels.indexOf("Sin nivel")).toBeLessThan(labels.indexOf("Inservible"))
  })

  it("hands back the level as a number", () => {
    const onChange = vi.fn()
    render(<TrustLevelFilter hidden={[]} onChange={onChange} />)
    click(screen.getByRole("button", { name: /Niveles/ }))
    click(screen.getByRole("button", { name: "Interesante" }))
    expect(onChange).toHaveBeenCalledWith([4])
  })

  it("treats Sin nivel as level 0", () => {
    const onChange = vi.fn()
    render(<TrustLevelFilter hidden={[]} onChange={onChange} />)
    click(screen.getByRole("button", { name: /Niveles/ }))
    click(screen.getByRole("button", { name: "Sin nivel" }))
    expect(onChange).toHaveBeenCalledWith([0])
  })

  it("shows the levels already hidden as unticked", () => {
    render(<TrustLevelFilter hidden={[1]} onChange={vi.fn()} />)
    expect(screen.getByRole("button", { name: /Niveles \(2\/3\)/ })).toBeInTheDocument()
  })
})
