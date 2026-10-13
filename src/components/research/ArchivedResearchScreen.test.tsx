import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { act } from "react"
import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { render } from "@/tests/render"
import type { ArchivedWebResearch } from "@/types"
import type { Role } from "@/lib/roles"
import { apiError } from "@/tests/apiError"

const archived = vi.fn()
const restore = vi.fn()
const toastSuccess = vi.fn()

vi.mock("@/services/api", () => ({
  ResearchService: {
    archived: () => archived(),
    restore: (...args: unknown[]) => restore(...args),
  },
}))

vi.mock("sonner", () => ({ toast: { success: (...args: unknown[]) => toastSuccess(...args) } }))

const { ArchivedResearchScreen } = await import("@/components/research/ArchivedResearchScreen")
const { CreatorRoute } = await import("@/components/layout/CreatorRoute")
const { useStore } = await import("@/store/useStore")
const { useAuthStore } = await import("@/store/useAuthStore")

function item(overrides: Partial<ArchivedWebResearch> = {}): ArchivedWebResearch {
  return {
    id: "r1",
    taxId: "30501677643",
    businessName: "SANCOR COOPERATIVAS UNIDAS LIMITADA",
    requestedAt: "2026-10-13T15:00:00.000Z",
    requestedBy: "ana",
    status: "done",
    summary: "Cooperativa de seguros de Sunchales.",
    sources: [{ url: "https://example.com/sancor", title: "Sancor en la web" }],
    model: "claude",
    costUsd: 0.4567,
    webSearches: 3,
    archivedAt: "2026-10-14T18:30:00.000Z",
    archivedBy: "santi",
    ...overrides,
  }
}

function show(): void {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/archived-research"]}>
        <Routes>
          <Route path="/" element={<p>Inicio</p>} />
          <Route path="/edit" element={<p>Detalle del CUIT</p>} />
          <Route path="/archived-research" element={<CreatorRoute><ArchivedResearchScreen /></CreatorRoute>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

function logIn(role: Role): void {
  act(() => useAuthStore.getState().setAuth("t1", "santi", role))
}

describe("ArchivedResearchScreen", () => {
  beforeEach(() => {
    archived.mockReset().mockResolvedValue([item()])
    restore.mockReset()
    toastSuccess.mockReset()
    logIn("creator")
  })

  afterEach(() => {
    act(() => useAuthStore.getState().clearAuth())
  })

  it("lists each archived research with who asked, who archived and the cost", async () => {
    show()
    const row = within((await screen.findByText("SANCOR COOPERATIVAS UNIDAS LIMITADA")).closest("tr")!)
    expect(row.getByText("30501677643")).toBeInTheDocument()
    expect(row.getByText("13/10/2026, 12:00")).toBeInTheDocument()
    expect(row.getByText("ana")).toBeInTheDocument()
    expect(row.getByText("santi · 14/10/2026, 15:30")).toBeInTheDocument()
    expect(row.getByText("US$ 0,46")).toBeInTheDocument()
  })

  it("marks a failed research", async () => {
    archived.mockResolvedValue([item({ status: "failed", summary: "", sources: [] })])
    show()
    expect(await screen.findByText("Falló")).toBeInTheDocument()
  })

  it("keeps the summary folded until asked", async () => {
    show()
    const toggle = await screen.findByRole("button", { name: "Ver resumen" })
    expect(screen.queryByText("Cooperativa de seguros de Sunchales.")).not.toBeInTheDocument()
    await userEvent.click(toggle)
    const details = within(screen.getByTestId("archived-r1"))
    expect(details.getByText("Cooperativa de seguros de Sunchales.")).toBeInTheDocument()
    expect(details.getByRole("link", { name: "Sancor en la web" })).toHaveAttribute("href", "https://example.com/sancor")
    await userEvent.click(screen.getByRole("button", { name: "Ocultar resumen" }))
    expect(screen.queryByText("Cooperativa de seguros de Sunchales.")).not.toBeInTheDocument()
  })

  it("restores without asking, says so and reloads the list", async () => {
    restore.mockResolvedValue(item({ archivedAt: null, archivedBy: null }))
    show()
    await screen.findByText("SANCOR COOPERATIVAS UNIDAS LIMITADA")
    archived.mockResolvedValue([])
    await userEvent.click(screen.getByRole("button", { name: "Restaurar" }))
    expect(restore).toHaveBeenCalledWith("r1")
    expect(toastSuccess).toHaveBeenCalledWith("Búsqueda restaurada")
    expect(await screen.findByText("No hay búsquedas archivadas.")).toBeInTheDocument()
  })

  it("shows a refused restore in Spanish", async () => {
    restore.mockRejectedValue(apiError("La búsqueda no está archivada"))
    show()
    await userEvent.click(await screen.findByRole("button", { name: "Restaurar" }))
    expect(await screen.findByText("La búsqueda no está archivada")).toBeInTheDocument()
    expect(toastSuccess).not.toHaveBeenCalled()
  })

  it("opens the CUIT from its name", async () => {
    show()
    await userEvent.click(await screen.findByRole("button", { name: "SANCOR COOPERATIVAS UNIDAS LIMITADA" }))
    expect(useStore.getState().editTaxId).toBe("30501677643")
    expect(screen.getByText("Detalle del CUIT")).toBeInTheDocument()
  })

  it("says when nothing is archived", async () => {
    archived.mockResolvedValue([])
    show()
    expect(await screen.findByText("No hay búsquedas archivadas.")).toBeInTheDocument()
  })

  it("says it is loading", () => {
    archived.mockReturnValue(new Promise(() => undefined))
    show()
    expect(screen.getByText("Cargando...")).toBeInTheDocument()
  })

  it("shows a list that could not load", async () => {
    archived.mockRejectedValue(apiError("No tenés permiso para esto"))
    show()
    expect(await screen.findByText("No tenés permiso para esto")).toBeInTheDocument()
  })

  it("sends an admin home without asking for the list", () => {
    logIn("admin")
    show()
    expect(screen.getByText("Inicio")).toBeInTheDocument()
    expect(archived).not.toHaveBeenCalled()
  })

  it("sends a member home without asking for the list", () => {
    logIn("member")
    show()
    expect(screen.getByText("Inicio")).toBeInTheDocument()
    expect(archived).not.toHaveBeenCalled()
  })
})
