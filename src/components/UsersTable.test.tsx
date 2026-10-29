import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { act } from "react"
import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@/tests/render"
import type { AppUser } from "@/types"
import type { Role } from "@/lib/roles"
import { apiError } from "@/tests/apiError"

const list = vi.fn()
const create = vi.fn()
const update = vi.fn()
const resetPassword = vi.fn()

vi.mock("@/services/api", () => ({
  UsersService: {
    list: () => list(),
    create: (...args: unknown[]) => create(...args),
    update: (...args: unknown[]) => update(...args),
    resetPassword: (...args: unknown[]) => resetPassword(...args),
  },
}))

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }))

const { UsersTable } = await import("@/components/UsersTable")
const { useAuthStore } = await import("@/store/useAuthStore")

const USERS: AppUser[] = [
  { username: "santi", role: "creator", createdAt: "2026-01-02T15:00:00.000Z", disabled: false },
  { username: "jefa", role: "admin", createdAt: "2026-02-02T15:00:00.000Z", disabled: false },
  { username: "ana", role: "member", createdAt: "2026-03-02T15:00:00.000Z", disabled: false },
  { username: "beto", role: "member", createdAt: "2026-04-02T15:00:00.000Z", disabled: true },
]

async function show(actor: string, role: Role): Promise<void> {
  act(() => useAuthStore.getState().setAuth("t1", actor, role))
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <UsersTable />
    </QueryClientProvider>
  )
  await screen.findByTestId("user-ana")
}

function row(username: string) {
  return within(screen.getByTestId(`user-${username}`))
}

describe("UsersTable", () => {
  beforeEach(() => {
    list.mockReset().mockResolvedValue(USERS)
    create.mockReset()
    update.mockReset().mockResolvedValue(USERS[2])
    resetPassword.mockReset().mockResolvedValue({ message: "ok" })
  })

  afterEach(() => {
    act(() => useAuthStore.getState().clearAuth())
  })

  it("lets an admin pick anyone's color from the palette, the creator's too", async () => {
    await show("jefa", "admin")
    const picker = within(screen.getByRole("radiogroup", { name: "Color de santi" }))
    expect(picker.getAllByRole("radio")).toHaveLength(18)
    await userEvent.click(picker.getByRole("radio", { name: "Turquesa" }))
    expect(update).toHaveBeenCalledWith("santi", { color: "teal" })
  })

  it("names the roles in Spanish", async () => {
    await show("santi", "creator")
    expect(row("santi").getByText("Creador")).toBeInTheDocument()
    expect(row("jefa").getByText("Admin")).toBeInTheDocument()
    expect(row("ana").getByText("Común")).toBeInTheDocument()
  })

  it("offers no action on the creator", async () => {
    await show("santi", "creator")
    expect(row("santi").queryAllByRole("button")).toHaveLength(0)
  })

  it("lets the creator remove an admin", async () => {
    await show("santi", "creator")
    await userEvent.click(row("jefa").getByRole("button", { name: /Quitar admin/ }))
    expect(update).toHaveBeenCalledWith("jefa", { role: "member" })
  })

  it("shows an admin no action on admins, their own row included", async () => {
    await show("jefa", "admin")
    expect(row("jefa").queryAllByRole("button")).toHaveLength(0)
    expect(row("santi").queryAllByRole("button")).toHaveLength(0)
  })

  it("lets an admin make a member admin", async () => {
    await show("jefa", "admin")
    await userEvent.click(row("ana").getByRole("button", { name: /Hacer admin/ }))
    expect(update).toHaveBeenCalledWith("ana", { role: "admin" })
  })

  it("disables an active user and enables a disabled one", async () => {
    await show("jefa", "admin")
    await userEvent.click(row("ana").getByRole("button", { name: /Deshabilitar/ }))
    expect(update).toHaveBeenCalledWith("ana", { disabled: true })
    await userEvent.click(row("beto").getByRole("button", { name: /Habilitar/ }))
    expect(update).toHaveBeenCalledWith("beto", { disabled: false })
  })

  it("shows a refusal in Spanish", async () => {
    update.mockRejectedValue(apiError("Solo el creador puede hacer esto"))
    await show("jefa", "admin")
    await userEvent.click(row("ana").getByRole("button", { name: /Hacer admin/ }))
    expect(await screen.findByText("Solo el creador puede hacer esto")).toBeInTheDocument()
  })

  it("resets a password only once it is valid", async () => {
    await show("jefa", "admin")
    await userEvent.click(row("ana").getByRole("button", { name: /Resetear contraseña/ }))
    await userEvent.type(screen.getByLabelText("Contraseña nueva"), "corta")
    expect(screen.getByText("La contraseña tiene que tener entre 8 y 72 caracteres")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled()
    await userEvent.type(screen.getByLabelText("Contraseña nueva"), "-larga")
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }))
    expect(resetPassword).toHaveBeenCalledWith("ana", "corta-larga")
  })
})

describe("UsersTable — new user", () => {
  beforeEach(() => {
    list.mockReset().mockResolvedValue(USERS)
    create.mockReset().mockResolvedValue(USERS[2])
  })

  afterEach(() => {
    act(() => useAuthStore.getState().clearAuth())
  })

  async function openForm(): Promise<void> {
    await show("santi", "creator")
    await userEvent.click(screen.getByRole("button", { name: /Nuevo usuario/ }))
  }

  it("offers only Común and Admin", async () => {
    await openForm()
    const dialog = within(screen.getByRole("dialog"))
    expect(dialog.getByRole("button", { name: "Común" })).toBeInTheDocument()
    expect(dialog.getByRole("button", { name: "Admin" })).toBeInTheDocument()
    expect(dialog.queryByRole("button", { name: "Creador" })).not.toBeInTheDocument()
  })

  it("refuses a username with spaces without calling the API", async () => {
    await openForm()
    await userEvent.type(screen.getByLabelText("Usuario"), "ana perez")
    await userEvent.type(screen.getByLabelText("Contraseña"), "12345678")
    expect(
      screen.getByText("El usuario tiene que tener entre 3 y 32 letras, números, puntos, guiones o guiones bajos")
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Crear" })).toBeDisabled()
    expect(create).not.toHaveBeenCalled()
  })

  it("refuses a short password", async () => {
    await openForm()
    await userEvent.type(screen.getByLabelText("Usuario"), "nuevo")
    await userEvent.type(screen.getByLabelText("Contraseña"), "1234567")
    expect(screen.getByText("La contraseña tiene que tener entre 8 y 72 caracteres")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Crear" })).toBeDisabled()
  })

  it("creates an admin with a trimmed username", async () => {
    await openForm()
    await userEvent.type(screen.getByLabelText("Usuario"), " nuevo ")
    await userEvent.type(screen.getByLabelText("Contraseña"), "12345678")
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Admin" }))
    await userEvent.click(screen.getByRole("button", { name: "Crear" }))
    expect(create).toHaveBeenCalledWith("nuevo", "12345678", "admin")
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("shows a taken username in Spanish", async () => {
    create.mockRejectedValue(apiError("Ese usuario ya existe"))
    await openForm()
    await userEvent.type(screen.getByLabelText("Usuario"), "ana")
    await userEvent.type(screen.getByLabelText("Contraseña"), "12345678")
    await userEvent.click(screen.getByRole("button", { name: "Crear" }))
    expect(await screen.findByText("Ese usuario ya existe")).toBeInTheDocument()
  })
})
