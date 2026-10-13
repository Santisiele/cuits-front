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

async function openMenu(role: Role): Promise<void> {
  act(() => useAuthStore.getState().setAuth("t1", "santi", role))
  render(
    <MemoryRouter>
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
})
