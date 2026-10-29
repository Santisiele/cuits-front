import { describe, it, expect, afterEach } from "vitest"
import { act } from "react"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { render } from "@/tests/render"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { useAuthStore } from "@/store/useAuthStore"
import type { Role } from "@/lib/roles"

const ADMIN_ITEMS = ["Manejar relación", "Fuentes", "Niveles de confianza", "Usuarios", "Créditos IA"]

async function openMenu(role: Role, path = "/"): Promise<void> {
  act(() => useAuthStore.getState().setAuth("t1", "santi", role))
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppSidebar />
    </MemoryRouter>
  )
  await userEvent.click(screen.getByRole("button", { name: "Abrir menú" }))
}

describe("AppSidebar", () => {
  afterEach(() => {
    act(() => useAuthStore.getState().clearAuth())
  })

  it("shows a member none of the admin items", async () => {
    await openMenu("member")
    for (const label of ADMIN_ITEMS) {
      expect(screen.queryByRole("link", { name: label })).not.toBeInTheDocument()
    }
  })

  it("still shows a member the screens they can use", async () => {
    await openMenu("member")
    expect(screen.getByRole("link", { name: "Buscar CUIT" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Editar persona" })).toBeInTheDocument()
  })

  it("shows a member the CRM agenda and companies", async () => {
    await openMenu("member")
    expect(screen.getByRole("link", { name: "Agenda" })).toHaveAttribute("href", "/crm/agenda")
    expect(screen.getByRole("link", { name: "Empresas" })).toHaveAttribute("href", "/crm")
  })

  it("marks only the agenda while on it", async () => {
    await openMenu("member", "/crm/agenda")
    expect(screen.getByRole("link", { name: "Agenda" })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("link", { name: "Empresas" })).not.toHaveAttribute("aria-current")
  })

  it("shows an admin every admin item", async () => {
    await openMenu("admin")
    for (const label of ADMIN_ITEMS) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument()
    }
  })

  it("shows the creator every admin item", async () => {
    await openMenu("creator")
    for (const label of ADMIN_ITEMS) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument()
    }
  })
})

describe("AppSidebar creator items", () => {
  afterEach(() => {
    act(() => useAuthStore.getState().clearAuth())
  })

  it("shows the creator the birthday progress", async () => {
    await openMenu("creator")
    expect(screen.getByRole("link", { name: "Carga de cumpleaños" })).toHaveAttribute("href", "/birthday-progress")
  })

  it("hides the birthday progress from an admin", async () => {
    await openMenu("admin")
    expect(screen.queryByRole("link", { name: "Carga de cumpleaños" })).not.toBeInTheDocument()
  })

  it("hides the birthday progress from a member", async () => {
    await openMenu("member")
    expect(screen.queryByRole("link", { name: "Carga de cumpleaños" })).not.toBeInTheDocument()
  })

  it("shows the creator the archived research", async () => {
    await openMenu("creator")
    expect(screen.getByRole("link", { name: "Búsquedas archivadas" })).toHaveAttribute("href", "/archived-research")
  })

  it("hides the archived research from an admin", async () => {
    await openMenu("admin")
    expect(screen.queryByRole("link", { name: "Búsquedas archivadas" })).not.toBeInTheDocument()
  })

  it("hides the archived research from a member", async () => {
    await openMenu("member")
    expect(screen.queryByRole("link", { name: "Búsquedas archivadas" })).not.toBeInTheDocument()
  })

  it("shows the creator the Nosis queue and nobody else", async () => {
    await openMenu("creator")
    expect(screen.getByRole("link", { name: "Pendientes de Nosis" })).toHaveAttribute("href", "/nosis-pending")
  })

  it("hides the Nosis queue from an admin", async () => {
    await openMenu("admin")
    expect(screen.queryByRole("link", { name: "Pendientes de Nosis" })).not.toBeInTheDocument()
  })
})
