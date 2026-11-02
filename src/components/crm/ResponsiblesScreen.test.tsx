import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@/tests/render"

const responsibles = vi.fn()
const users = vi.fn()
const createResponsible = vi.fn()
const updateResponsible = vi.fn()

vi.mock("@/services/api", () => ({
  CrmApiService: {
    responsibles: () => responsibles(),
    users: () => users(),
    createResponsible: (...args: unknown[]) => createResponsible(...args),
    updateResponsible: (...args: unknown[]) => updateResponsible(...args),
  },
}))

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const { ResponsiblesScreen } = await import("@/components/crm/ResponsiblesScreen")

async function show(): Promise<void> {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <ResponsiblesScreen />
    </QueryClientProvider>
  )
  await screen.findByTestId("responsible-Triunvirato")
}

describe("ResponsiblesScreen", () => {
  beforeEach(() => {
    responsibles.mockReset().mockResolvedValue([
      { name: "Triunvirato", color: "orange", users: ["luchi", "diego", "flavia"], disabled: false },
      { name: "Raul", color: "sky-500", users: [], disabled: false },
    ])
    users.mockReset().mockResolvedValue([
      { username: "luchi", color: null },
      { username: "diego", color: null },
      { username: "flavia", color: null },
      { username: "sol", color: null },
    ])
    createResponsible.mockReset().mockResolvedValue({})
    updateResponsible.mockReset().mockResolvedValue({})
  })

  it("shows the users each one stands for", async () => {
    await show()
    const group = within(screen.getByTestId("responsible-Triunvirato"))
    expect(await group.findByLabelText("luchi")).toBeChecked()
    expect(group.getByLabelText("sol")).not.toBeChecked()
  })

  it("picks a color from a palette with several blues", async () => {
    await show()
    const picker = within(screen.getByRole("radiogroup", { name: "Color de Raul" }))
    expect(picker.getByRole("radio", { name: "Celeste" })).toHaveAttribute("aria-checked", "true")
    for (const blue of ["Celeste claro", "Celeste oscuro", "Azul claro", "Azul", "Azul oscuro", "Azul marino", "Índigo"]) {
      expect(picker.getByRole("radio", { name: blue })).toBeInTheDocument()
    }
    await userEvent.click(picker.getByRole("radio", { name: "Azul marino" }))
    expect(updateResponsible).toHaveBeenCalledWith("Raul", { color: "blue-900" })
  })

  it("links a user, renames and disables", async () => {
    await show()
    const raul = within(screen.getByTestId("responsible-Raul"))
    await userEvent.click(await raul.findByLabelText("sol"))
    expect(updateResponsible).toHaveBeenLastCalledWith("Raul", { users: ["sol"] })
    await userEvent.clear(raul.getByLabelText("Nombre de Raul"))
    await userEvent.type(raul.getByLabelText("Nombre de Raul"), "Raúl")
    await userEvent.click(raul.getByRole("button", { name: "Renombrar" }))
    expect(updateResponsible).toHaveBeenLastCalledWith("Raul", { name: "Raúl" })
    await userEvent.click(raul.getByRole("button", { name: "Deshabilitar" }))
    expect(updateResponsible).toHaveBeenLastCalledWith("Raul", { disabled: true })
  })

  it("adds one and checks the name length first", async () => {
    await show()
    await userEvent.type(screen.getByLabelText("Nuevo responsable"), "N")
    expect(screen.getByText("El nombre tiene que tener entre 2 y 40 caracteres")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Agregar" })).toBeDisabled()
    await userEvent.type(screen.getByLabelText("Nuevo responsable"), "atasha")
    await userEvent.click(screen.getByRole("button", { name: "Agregar" }))
    expect(createResponsible).toHaveBeenCalledWith({ name: "Natasha", color: "blue-500", users: [] })
  })
})
