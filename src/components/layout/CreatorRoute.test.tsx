import { describe, it, expect, afterEach } from "vitest"
import { act } from "react"
import { screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { render } from "@/tests/render"
import { CreatorRoute } from "@/components/layout/CreatorRoute"
import { useAuthStore } from "@/store/useAuthStore"
import type { Role } from "@/lib/roles"

function visit(role: Role | null, token: string | null = "t1"): void {
  act(() => {
    if (token) useAuthStore.getState().setAuth(token, "santi", role)
  })
  render(
    <MemoryRouter initialEntries={["/birthday-progress"]}>
      <Routes>
        <Route path="/" element={<p>Inicio</p>} />
        <Route path="/birthday-progress" element={<CreatorRoute><p>Pantalla del creador</p></CreatorRoute>} />
      </Routes>
    </MemoryRouter>
  )
}

describe("CreatorRoute", () => {
  afterEach(() => {
    act(() => useAuthStore.getState().clearAuth())
  })

  it("lets the creator in", () => {
    visit("creator")
    expect(screen.getByText("Pantalla del creador")).toBeInTheDocument()
  })

  it("sends an admin to the home route without a word", () => {
    visit("admin")
    expect(screen.getByText("Inicio")).toBeInTheDocument()
    expect(screen.queryByText("Pantalla del creador")).not.toBeInTheDocument()
  })

  it("sends a member to the home route without a word", () => {
    visit("member")
    expect(screen.getByText("Inicio")).toBeInTheDocument()
    expect(screen.queryByText("Pantalla del creador")).not.toBeInTheDocument()
  })

  it("sends someone without a session home", () => {
    visit(null, null)
    expect(screen.getByText("Inicio")).toBeInTheDocument()
  })

  it("waits while the role of a session is not known yet", () => {
    visit(null)
    expect(screen.queryByText("Inicio")).not.toBeInTheDocument()
    expect(screen.queryByText("Pantalla del creador")).not.toBeInTheDocument()
  })
})
