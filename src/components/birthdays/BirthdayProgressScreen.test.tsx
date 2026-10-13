import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { act } from "react"
import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { render } from "@/tests/render"
import type { BirthdayProgress } from "@/types"
import type { Role } from "@/lib/roles"

const get = vi.fn()

vi.mock("@/services/api", () => ({
  BirthdayProgressService: { get: () => get() },
}))

const { BirthdayProgressScreen } = await import("@/components/birthdays/BirthdayProgressScreen")
const { CreatorRoute } = await import("@/components/layout/CreatorRoute")
const { useStore } = await import("@/store/useStore")
const { useAuthStore } = await import("@/store/useAuthStore")

const PROGRESS: BirthdayProgress = {
  knownPeople: 2101,
  withBirthday: 1348,
  missing: 753,
  bySource: [
    { source: "Bolsa", people: 1500, withBirthday: 1000, missing: 500 },
    { source: "Agro", people: 601, withBirthday: 348, missing: 253 },
  ],
  sweep: { day: "2026-10-13", consultedToday: 61, dailyLimit: 100, updatedAt: "2026-10-13T15:04:00.000Z" },
  misses: [{ taxId: "20333333334", businessName: "GOMEZ ANA", missedOn: "2026-09-17" }],
  pending: [
    { taxId: "20111111112", businessName: "PEREZ JUAN", sources: ["Bolsa"] },
    { taxId: "20222222223", businessName: "LOPEZ MARIA", sources: ["Agro"] },
  ],
}

function show(path = "/birthday-progress"): void {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={<p>Inicio</p>} />
          <Route path="/edit" element={<p>Detalle del CUIT</p>} />
          <Route path="/birthday-progress" element={<CreatorRoute><BirthdayProgressScreen /></CreatorRoute>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

function logIn(role: Role): void {
  act(() => useAuthStore.getState().setAuth("t1", "santi", role))
}

function rowOf(text: string): HTMLElement {
  return screen.getByText(text).closest("tr")!
}

describe("BirthdayProgressScreen", () => {
  beforeEach(() => {
    get.mockReset().mockResolvedValue(PROGRESS)
    logIn("creator")
  })

  afterEach(() => {
    act(() => useAuthStore.getState().clearAuth())
  })

  it("shows the overall progress", async () => {
    show()
    expect(await screen.findByText("1.348 de 2.101 personas con cumpleaños")).toBeInTheDocument()
    expect(screen.getByText("Faltan 753 personas")).toBeInTheDocument()
    expect(screen.getByRole("progressbar", { name: "Personas con cumpleaños" })).toHaveAttribute("aria-valuenow", "64")
  })

  it("shows today's sweep", async () => {
    show()
    expect(await screen.findByText("Hoy: 61 de 100 consultas")).toBeInTheDocument()
    expect(screen.getByRole("progressbar", { name: "Consultas de hoy" })).toHaveAttribute("aria-valuenow", "61")
    expect(screen.getByText("Última actualización: 13/10/2026 12:04")).toBeInTheDocument()
    expect(screen.getByText("El barrido corre en tu máquina con pnpm scrape:birthdays")).toBeInTheDocument()
  })

  it("says when the sweep has not run yet", async () => {
    get.mockResolvedValue({ ...PROGRESS, sweep: { day: null, consultedToday: 0, dailyLimit: 100, updatedAt: null } })
    show()
    expect(await screen.findByText("El barrido todavía no registró actividad")).toBeInTheDocument()
    expect(screen.getByText("Hoy: 0 de 100 consultas")).toBeInTheDocument()
  })

  it("lists each source in the order received", async () => {
    show()
    await screen.findByText("Por fuente")
    const bolsa = within(rowOf("1.500"))
    expect(bolsa.getByText("Bolsa")).toBeInTheDocument()
    expect(bolsa.getByText("1.000")).toBeInTheDocument()
    expect(bolsa.getByText("500")).toBeInTheDocument()
    const sourceRows = screen.getByText("Por fuente").closest("[data-slot=card]")!.querySelectorAll("tbody tr")
    expect([...sourceRows].map((row) => row.firstChild?.textContent)).toEqual(["Bolsa", "Agro"])
  })

  it("lists the pending people with their sources", async () => {
    show()
    expect(await screen.findByText("Pendientes (2)")).toBeInTheDocument()
    const perez = within(rowOf("PEREZ JUAN"))
    expect(perez.getByText("20111111112")).toBeInTheDocument()
    expect(perez.getByText("Bolsa")).toBeInTheDocument()
  })

  it("narrows the pending list by name or CUIT", async () => {
    show()
    await screen.findByText("PEREZ JUAN")
    await userEvent.type(screen.getByPlaceholderText("Buscar por nombre o CUIT..."), "2022")
    expect(screen.getByText("Pendientes (1 de 2)")).toBeInTheDocument()
    expect(screen.queryByText("PEREZ JUAN")).not.toBeInTheDocument()
    expect(screen.getByText("LOPEZ MARIA")).toBeInTheDocument()
  })

  it("filters the pending list by source", async () => {
    show()
    await screen.findByText("PEREZ JUAN")
    await userEvent.click(screen.getByRole("button", { name: /Fuentes/ }))
    const filter = await screen.findByRole("dialog", { name: "Filtro de Fuentes" })
    await userEvent.click(within(filter).getByText("Agro"))
    expect(screen.getByText("PEREZ JUAN")).toBeInTheDocument()
    expect(screen.queryByText("LOPEZ MARIA")).not.toBeInTheDocument()
  })

  it("lists the people Nosis did not find with the day", async () => {
    show()
    expect(await screen.findByText("No encontrados en Nosis (1)")).toBeInTheDocument()
    const gomez = within(rowOf("GOMEZ ANA"))
    expect(gomez.getByText("20333333334")).toBeInTheDocument()
    expect(gomez.getByText("17/09/2026")).toBeInTheDocument()
  })

  it("opens the CUIT detail from a row", async () => {
    show()
    await userEvent.click(await screen.findByText("GOMEZ ANA"))
    expect(await screen.findByText("Detalle del CUIT")).toBeInTheDocument()
    expect(useStore.getState().editTaxId).toBe("20333333334")
  })

  it("says when both lists are empty", async () => {
    get.mockResolvedValue({ ...PROGRESS, pending: [], misses: [] })
    show()
    expect(await screen.findByText("No queda nadie pendiente.")).toBeInTheDocument()
    expect(screen.getByText("Nosis encontró a todos los que se consultaron.")).toBeInTheDocument()
  })

  it("shows that it is loading", () => {
    get.mockReturnValue(new Promise(() => undefined))
    show()
    expect(screen.getByText("Cargando...")).toBeInTheDocument()
  })

  it("shows a progress that could not load", async () => {
    get.mockRejectedValue(new Error("No tenés permiso para esto"))
    show()
    expect(await screen.findByText("No tenés permiso para esto")).toBeInTheDocument()
  })

  it("sends an admin home without asking the API", () => {
    logIn("admin")
    show()
    expect(screen.getByText("Inicio")).toBeInTheDocument()
    expect(get).not.toHaveBeenCalled()
  })

  it("sends a member home without asking the API", () => {
    logIn("member")
    show()
    expect(screen.getByText("Inicio")).toBeInTheDocument()
    expect(get).not.toHaveBeenCalled()
  })
})
