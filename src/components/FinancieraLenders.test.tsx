import { describe, it, expect } from "vitest"
import { act } from "react"
import { screen, within, fireEvent } from "@testing-library/react"
import { render } from "@/tests/render"
import { FinancieraLenders } from "@/components/FinancieraLenders"
import type { FinancieraLender } from "@/types"

const LENDERS: FinancieraLender[] = [
  {
    entityName: "BANCO DE COMERCIO S.A.",
    months: [
      { period: "2026-07", situation: "1", totalLoan: 1680672000 },
      { period: "2026-06", situation: "2", totalLoan: 1500000000 },
    ],
  },
  {
    entityName: "FINARES S.A.",
    months: [
      { period: "2026-05", situation: "3", totalLoan: 305522000 },
      { period: "", situation: "1", totalLoan: 1000 },
    ],
  },
]

function lenderBlocks(): HTMLElement[] {
  return screen.getAllByRole("rowgroup").slice(1)
}

function monthRows(block: HTMLElement): HTMLElement[] {
  return within(block).getAllByRole("row").slice(1)
}

describe("FinancieraLenders", () => {
  it("titles the list the way it was asked for", () => {
    render(<FinancieraLenders lenders={LENDERS} />)
    expect(screen.getByText("Financieras a las que le pidió")).toBeInTheDocument()
  })

  it("drops the old count and total columns", () => {
    render(<FinancieraLenders lenders={LENDERS} />)
    expect(screen.queryByText("Veces")).not.toBeInTheDocument()
    expect(screen.queryByText("Préstamo total")).not.toBeInTheDocument()
  })

  it("shows one block per lender, in the order the API sent", () => {
    render(<FinancieraLenders lenders={LENDERS} />)
    const blocks = lenderBlocks()
    expect(blocks).toHaveLength(2)
    expect(within(blocks[0]!).getByRole("rowheader", { name: "BANCO DE COMERCIO S.A." })).toBeInTheDocument()
    expect(within(blocks[1]!).getByRole("rowheader", { name: "FINARES S.A." })).toBeInTheDocument()
  })

  it("shows each month on its own line, newest first", () => {
    render(<FinancieraLenders lenders={LENDERS} />)
    const [july, june] = monthRows(lenderBlocks()[0]!)
    expect(within(july!).getByText("Julio 2026")).toBeInTheDocument()
    expect(within(july!).getByText("Situación 1")).toBeInTheDocument()
    expect(within(july!).getByText("$ 1.680.672.000")).toBeInTheDocument()
    expect(within(june!).getByText("Junio 2026")).toBeInTheDocument()
    expect(within(june!).getByText("Situación 2")).toBeInTheDocument()
    expect(within(june!).getByText("$ 1.500.000.000")).toBeInTheDocument()
  })

  it("never adds the months up", () => {
    render(<FinancieraLenders lenders={LENDERS} />)
    expect(screen.queryByText("$ 3.180.672.000")).not.toBeInTheDocument()
  })

  it("labels a month that came without a date", () => {
    render(<FinancieraLenders lenders={LENDERS} />)
    const undated = monthRows(lenderBlocks()[1]!)[1]!
    expect(within(undated).getByText("Sin fecha")).toBeInTheDocument()
    expect(within(undated).getByText("$ 1.000")).toBeInTheDocument()
  })

  it("labels a lender that came without a name", () => {
    render(<FinancieraLenders lenders={[{ entityName: "", months: [{ period: "2026-07", situation: "1", totalLoan: 100 }] }]} />)
    expect(screen.getByRole("rowheader", { name: "Sin nombre" })).toBeInTheDocument()
  })

  it("draws nothing for someone who owes no lender", () => {
    const { container } = render(<FinancieraLenders lenders={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  describe("filtering by lender", () => {
    function click(element: Element): void {
      act(() => {
        fireEvent.click(element)
      })
    }

    function openFilter(): void {
      click(screen.getByRole("button", { name: /^Financiera/ }))
    }

    it("offers every lender in the header's list", () => {
      render(<FinancieraLenders lenders={LENDERS} />)
      openFilter()
      const list = screen.getByRole("dialog", { name: "Filtro de Financiera" })
      expect(within(list).getByRole("button", { name: "FINARES S.A." })).toBeInTheDocument()
      expect(within(list).getByRole("button", { name: "BANCO DE COMERCIO S.A." })).toBeInTheDocument()
    })

    it("hides a lender when it is unticked", () => {
      render(<FinancieraLenders lenders={LENDERS} />)
      openFilter()
      click(within(screen.getByRole("dialog", { name: "Filtro de Financiera" })).getByRole("button", { name: "FINARES S.A." }))
      const blocks = lenderBlocks()
      expect(blocks).toHaveLength(1)
      expect(within(blocks[0]!).getByRole("rowheader", { name: "BANCO DE COMERCIO S.A." })).toBeInTheDocument()
    })

    it("says so when every lender is filtered out", () => {
      render(<FinancieraLenders lenders={LENDERS} />)
      openFilter()
      click(within(screen.getByRole("dialog", { name: "Filtro de Financiera" })).getByRole("button", { name: "Seleccionar todos" }))
      expect(screen.getByText("Ninguna financiera coincide con el filtro")).toBeInTheDocument()
    })
  })
})
