import { describe, it, expect } from "vitest"
import { screen, within } from "@testing-library/react"
import { render } from "@/tests/render"
import { FinancieraLenders } from "@/components/FinancieraLenders"
import type { FinancieraLender } from "@/types"

const LENDERS: FinancieraLender[] = [
  { entityName: "Cooperativa de Crédito y Vivienda Unicred Ltda.", operationCount: 1, totalLoan: 1680672000 },
  { entityName: "FINARES S.A.", operationCount: 2, totalLoan: 305522000 },
]

function rows(): HTMLElement[] {
  return screen.getAllByRole("row").slice(1)
}

describe("FinancieraLenders", () => {
  it("titles the list the way it was asked for", () => {
    render(<FinancieraLenders lenders={LENDERS} />)
    expect(screen.getByText("Financieras a las que le pidió")).toBeInTheDocument()
  })

  it("names the three columns", () => {
    render(<FinancieraLenders lenders={LENDERS} />)
    expect(screen.getByRole("columnheader", { name: "Financiera" })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "Veces" })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "Préstamo total" })).toBeInTheDocument()
  })

  it("shows one row per lender", () => {
    render(<FinancieraLenders lenders={LENDERS} />)
    expect(rows()).toHaveLength(2)
  })

  it("keeps the order the API sent, largest total first", () => {
    render(<FinancieraLenders lenders={LENDERS} />)
    expect(within(rows()[0]!).getByText(/Unicred/)).toBeInTheDocument()
    expect(within(rows()[1]!).getByText("FINARES S.A.")).toBeInTheDocument()
  })

  it("shows how many times each lender was asked", () => {
    render(<FinancieraLenders lenders={LENDERS} />)
    expect(within(rows()[1]!).getByText("2")).toBeInTheDocument()
  })

  it("shows each total as pesos", () => {
    render(<FinancieraLenders lenders={LENDERS} />)
    expect(within(rows()[0]!).getByText("$ 1.680.672.000")).toBeInTheDocument()
    expect(within(rows()[1]!).getByText("$ 305.522.000")).toBeInTheDocument()
  })

  it("labels a lender that came without a name", () => {
    render(<FinancieraLenders lenders={[{ entityName: "", operationCount: 1, totalLoan: 100 }]} />)
    expect(screen.getByText("Sin nombre")).toBeInTheDocument()
  })

  it("draws nothing for someone who owes no lender", () => {
    const { container } = render(<FinancieraLenders lenders={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
