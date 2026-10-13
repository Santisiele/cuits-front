import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@/tests/render"
import type { RecentWebResearch, ResearchBudget } from "@/types"
import { apiError } from "@/tests/apiError"

const budget = vi.fn()
const recent = vi.fn()
const setLimit = vi.fn()

vi.mock("@/services/api", () => ({
  ResearchService: {
    budget: () => budget(),
    recent: () => recent(),
    setLimit: (...args: unknown[]) => setLimit(...args),
  },
}))

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }))

const { AiCreditsScreen } = await import("@/components/research/AiCreditsScreen")

const BUDGET: ResearchBudget = { monthlyLimitUsd: 20, spentThisMonthUsd: 5, researchCountThisMonth: 3 }

const RECENT: RecentWebResearch[] = [
  {
    id: "r1",
    taxId: "30501677643",
    businessName: "SANCOR COOPERATIVAS UNIDAS LIMITADA",
    requestedAt: "2026-10-13T15:00:00.000Z",
    requestedBy: "santi",
    status: "done",
    summary: "",
    sources: [],
    model: "claude",
    costUsd: 0.4567,
    webSearches: 3,
  },
  {
    id: "r2",
    taxId: "20111111112",
    businessName: "PEREZ JUAN",
    requestedAt: "2026-10-12T15:00:00.000Z",
    requestedBy: "jefa",
    status: "failed",
    summary: "",
    sources: [],
    model: "claude",
    costUsd: 0.01,
    webSearches: 0,
  },
]

async function show(): Promise<void> {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <AiCreditsScreen />
    </QueryClientProvider>
  )
  await screen.findByLabelText("Tope mensual (US$)")
}

describe("AiCreditsScreen", () => {
  beforeEach(() => {
    budget.mockReset().mockResolvedValue(BUDGET)
    recent.mockReset().mockResolvedValue(RECENT)
    setLimit.mockReset()
  })

  it("shows what was spent against the limit", async () => {
    await show()
    expect(screen.getByText("US$ 5,00")).toBeInTheDocument()
    expect(screen.getByText(/de US\$ 20,00/)).toBeInTheDocument()
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25")
    expect(screen.getByText("3 búsquedas este mes")).toBeInTheDocument()
  })

  it("reminds that the console limit still matters", async () => {
    await show()
    expect(
      screen.getByText("El tope de la app no reemplaza el límite configurado en la consola de Anthropic")
    ).toBeInTheDocument()
  })

  it("lists the recent research with CUIT, name, requester, date and cost", async () => {
    await show()
    expect(await screen.findByText("SANCOR COOPERATIVAS UNIDAS LIMITADA")).toBeInTheDocument()
    expect(screen.getByText("30501677643")).toBeInTheDocument()
    expect(screen.getByText("jefa")).toBeInTheDocument()
    expect(screen.getByText("13/10/2026, 12:00")).toBeInTheDocument()
    expect(screen.getByText("US$ 0,46")).toBeInTheDocument()
    expect(screen.getByText("Falló")).toBeInTheDocument()
  })

  it("refuses a negative limit without calling the API", async () => {
    await show()
    const input = screen.getByLabelText("Tope mensual (US$)")
    await userEvent.clear(input)
    await userEvent.type(input, "-5")
    expect(screen.getByText("El tope tiene que ser un número mayor o igual a 0")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Guardar tope" })).toBeDisabled()
    expect(setLimit).not.toHaveBeenCalled()
  })

  it("refuses an empty limit", async () => {
    await show()
    await userEvent.clear(screen.getByLabelText("Tope mensual (US$)"))
    expect(screen.getByRole("button", { name: "Guardar tope" })).toBeDisabled()
  })

  it("saves a new limit with a decimal comma", async () => {
    setLimit.mockResolvedValue({ ...BUDGET, monthlyLimitUsd: 12.5 })
    await show()
    const input = screen.getByLabelText("Tope mensual (US$)")
    await userEvent.clear(input)
    await userEvent.type(input, "12,5")
    await userEvent.click(screen.getByRole("button", { name: "Guardar tope" }))
    expect(setLimit).toHaveBeenCalledWith(12.5)
    expect(await screen.findByText(/de US\$ 12,50/)).toBeInTheDocument()
  })

  it("shows a refused limit in Spanish", async () => {
    setLimit.mockRejectedValue(apiError("El tope tiene que ser un número mayor o igual a 0"))
    await show()
    await userEvent.click(screen.getByRole("button", { name: "Guardar tope" }))
    expect(await screen.findByText("El tope tiene que ser un número mayor o igual a 0")).toBeInTheDocument()
  })

  it("marks a spent budget", async () => {
    budget.mockResolvedValue({ ...BUDGET, spentThisMonthUsd: 25, researchCountThisMonth: 1 })
    await show()
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100")
    expect(screen.getByText("1 búsqueda este mes")).toBeInTheDocument()
  })

  it("says when there is no research yet", async () => {
    recent.mockResolvedValue([])
    await show()
    expect(await screen.findByText("Todavía no hay investigaciones.")).toBeInTheDocument()
  })

  it("shows a budget that could not load", async () => {
    budget.mockRejectedValue(apiError("La investigación web no está configurada"))
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <AiCreditsScreen />
      </QueryClientProvider>
    )
    expect(await screen.findByText("La investigación web no está configurada")).toBeInTheDocument()
  })
})
