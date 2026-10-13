import { describe, it, expect, afterEach } from "vitest"
import { act } from "react"
import { screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { render } from "@/tests/render"
import { AdminRoute } from "@/components/layout/AdminRoute"
import { useAuthStore } from "@/store/useAuthStore"
import type { Role } from "@/lib/roles"

function visit(role: Role | null, token: string | null = "t1"): void {
  act(() => {
    if (token) useAuthStore.getState().setAuth(token, "santi", role)
  })
  render(
    <MemoryRouter initialEntries={["/sources"]}>
      <Routes>
        <Route path="/" element={<p>Inicio</p>} />
        <Route path="/sources" element={<AdminRoute><p>Pantalla de admin</p></AdminRoute>} />
      </Routes>
    </MemoryRouter>
  )
}

describe("AdminRoute", () => {
  afterEach(() => {
    act(() => useAuthStore.getState().clearAuth())
  })

  it("sends a member to the home route without a word", () => {
    visit("member")
    expect(screen.getByText("Inicio")).toBeInTheDocument()
    expect(screen.queryByText("Pantalla de admin")).not.toBeInTheDocument()
  })

  it("lets an admin in", () => {
    visit("admin")
    expect(screen.getByText("Pantalla de admin")).toBeInTheDocument()
  })

  it("lets the creator in", () => {
    visit("creator")
    expect(screen.getByText("Pantalla de admin")).toBeInTheDocument()
  })

  it("sends someone without a session home", () => {
    visit(null, null)
    expect(screen.getByText("Inicio")).toBeInTheDocument()
  })

  it("waits while the role of a session is not known yet", () => {
    visit(null)
    expect(screen.queryByText("Inicio")).not.toBeInTheDocument()
    expect(screen.queryByText("Pantalla de admin")).not.toBeInTheDocument()
  })
})
