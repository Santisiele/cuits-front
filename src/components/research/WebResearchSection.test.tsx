import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@/tests/render"
import type { WebResearch } from "@/types"
import { apiError } from "@/tests/apiError"

const history = vi.fn()
const run = vi.fn()

vi.mock("@/services/api", () => ({
  ResearchService: {
    history: (...args: unknown[]) => history(...args),
    run: (...args: unknown[]) => run(...args),
  },
}))

const { WebResearchSection } = await import("@/components/research/WebResearchSection")

function research(overrides: Partial<WebResearch> = {}): WebResearch {
  return {
    id: "r1",
    taxId: "30501677643",
    requestedAt: "2026-10-13T15:00:00.000Z",
    requestedBy: "santi",
    status: "done",
    summary: "Cooperativa de seguros de Sunchales.",
    sources: [{ url: "https://example.com/sancor", title: "Sancor en la web" }],
    model: "claude",
    costUsd: 0.4567,
    webSearches: 3,
    ...overrides,
  }
}

function show(taxId = "30-50167764-3"): void {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <WebResearchSection taxId={taxId} />
    </QueryClientProvider>
  )
}

describe("WebResearchSection", () => {
  beforeEach(() => {
    history.mockReset().mockResolvedValue([])
    run.mockReset()
  })

  it("asks for the history by the CUIT without dashes", async () => {
    show()
    await screen.findByText("Todavía no se buscó este CUIT en la web.")
    expect(history).toHaveBeenCalledWith("30501677643")
  })

  it("offers a first search when there is no history", async () => {
    show()
    await screen.findByText("Todavía no se buscó este CUIT en la web.")
    expect(screen.getByRole("button", { name: /Buscar en la web/ })).toBeEnabled()
  })

  it("shows the latest result with its sources, date, requester and cost", async () => {
    history.mockResolvedValue([research()])
    show()
    expect(await screen.findByText("Cooperativa de seguros de Sunchales.")).toBeInTheDocument()
    const link = screen.getByRole("link", { name: "Sancor en la web" })
    expect(link).toHaveAttribute("href", "https://example.com/sancor")
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
    expect(screen.getByText("13/10/2026, 12:00 · pedida por santi · US$ 0,46")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Volver a buscar/ })).toBeInTheDocument()
  })

  it("shows a failed research as failed", async () => {
    history.mockResolvedValue([research({ status: "failed", summary: "", sources: [] })])
    show()
    expect(await screen.findByText("La búsqueda falló")).toBeInTheDocument()
  })

  it("keeps earlier research folded until asked", async () => {
    history.mockResolvedValue([
      research(),
      research({ id: "r0", summary: "Un resumen viejo.", requestedAt: "2026-09-01T15:00:00.000Z" }),
    ])
    show()
    const toggle = await screen.findByRole("button", { name: /Búsquedas anteriores \(1\)/ })
    expect(screen.queryByText("Un resumen viejo.")).not.toBeInTheDocument()
    await userEvent.click(toggle)
    expect(screen.getByText("Un resumen viejo.")).toBeInTheDocument()
    await userEvent.click(toggle)
    expect(screen.queryByText("Un resumen viejo.")).not.toBeInTheDocument()
  })

  it("says it may take a while and blocks a second search while it runs", async () => {
    run.mockReturnValue(new Promise(() => undefined))
    show()
    await screen.findByText("Todavía no se buscó este CUIT en la web.")
    await userEvent.click(screen.getByRole("button", { name: /Buscar en la web/ }))
    expect(screen.getByText("Esto puede tardar hasta un par de minutos")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Buscando/ })).toBeDisabled()
    expect(run).toHaveBeenCalledTimes(1)
  })

  it("shows the new result once it arrives", async () => {
    run.mockResolvedValue(research())
    show()
    history.mockResolvedValue([research()])
    await screen.findByText("Todavía no se buscó este CUIT en la web.")
    await userEvent.click(screen.getByRole("button", { name: /Buscar en la web/ }))
    expect(await screen.findByText("Cooperativa de seguros de Sunchales.")).toBeInTheDocument()
    expect(screen.queryByText("Esto puede tardar hasta un par de minutos")).not.toBeInTheDocument()
  })

  it("shows a refusal in Spanish", async () => {
    run.mockRejectedValue(apiError("Se alcanzó el tope de gasto del mes"))
    show()
    await screen.findByText("Todavía no se buscó este CUIT en la web.")
    await userEvent.click(screen.getByRole("button", { name: /Buscar en la web/ }))
    expect(await screen.findByText("Se alcanzó el tope de gasto del mes")).toBeInTheDocument()
  })

  it("shows a history that could not load", async () => {
    history.mockRejectedValue(apiError("No tenés permiso para esto"))
    show()
    expect(await screen.findByText("No tenés permiso para esto")).toBeInTheDocument()
  })

  it("falls back to the address for a source without a title", async () => {
    history.mockResolvedValue([research({ sources: [{ url: "https://example.com/x", title: "" }] })])
    show()
    const card = within(await screen.findByTestId("research-r1"))
    expect(card.getByRole("link", { name: "https://example.com/x" })).toBeInTheDocument()
  })
})
