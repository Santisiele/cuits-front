import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@/tests/render"
import type { CrmAgendaItem } from "@/types"

const agenda = vi.fn()
const users = vi.fn()
const companies = vi.fn()
const createTask = vi.fn()

vi.mock("@/services/api", () => ({
  CrmApiService: {
    agenda: (assignee: string) => agenda(assignee),
    users: () => users(),
    companies: () => companies(),
    createTask: (...args: unknown[]) => createTask(...args),
  },
}))

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }))

const navigate = vi.fn()
vi.mock("react-router-dom", () => ({ useNavigate: () => navigate }))

const { CrmAgendaScreen } = await import("@/components/crm/CrmAgendaScreen")

function item(id: string, dueDate: string, overdue: boolean, businessName = "ACME SA", assignee = "flavia"): CrmAgendaItem {
  return {
    id,
    companyTaxId: "30712345678",
    businessName,
    description: `Tarea ${id}`,
    dueDate,
    status: "open",
    cancelReason: null,
    assignee,
    createdBy: "santi",
    contactIds: [],
    createdAt: "",
    closedAt: null,
    archivedAt: null,
    overdue,
  }
}

async function show(): Promise<void> {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <CrmAgendaScreen />
    </QueryClientProvider>
  )
  await screen.findByText("Tarea t1")
}

describe("CrmAgendaScreen", () => {
  beforeEach(() => {
    agenda.mockReset().mockResolvedValue([item("t1", "2026-10-28", true), item("t2", "2026-11-02", false, "OTRA SA", "pedro")])
    users.mockReset().mockResolvedValue([{ username: "flavia", color: "teal" }, { username: "pedro", color: null }])
    navigate.mockReset()
  })

  it("asks for my tasks first and keeps the order the API gives", async () => {
    await show()
    expect(agenda).toHaveBeenCalledWith("me")
    const rows = screen.getAllByTestId(/^agenda-/)
    expect(rows.map((row) => row.getAttribute("data-testid"))).toEqual(["agenda-t1", "agenda-t2"])
  })

  it("marks the overdue ones", async () => {
    await show()
    expect(within(screen.getByTestId("agenda-t1")).getByText("Vencida")).toBeInTheDocument()
    expect(within(screen.getByTestId("agenda-t2")).queryByText("Vencida")).not.toBeInTheDocument()
  })

  it("can show only the overdue ones", async () => {
    await show()
    await userEvent.click(screen.getByLabelText(/Solo vencidas/))
    expect(screen.getByTestId("agenda-t1")).toBeInTheDocument()
    expect(screen.queryByTestId("agenda-t2")).not.toBeInTheDocument()
  })

  it("switches to someone else's tasks or everybody's", async () => {
    await show()
    await screen.findByRole("option", { name: "pedro" })
    await userEvent.selectOptions(screen.getByLabelText("Responsable"), "pedro")
    expect(agenda).toHaveBeenLastCalledWith("pedro")
    await userEvent.selectOptions(screen.getByLabelText("Responsable"), "Todos")
    expect(agenda).toHaveBeenLastCalledWith("all")
  })

  it("paints each task with its assignee's color, chosen or derived", async () => {
    await show()
    await screen.findByRole("option", { name: "pedro" })
    expect(screen.getByTestId("agenda-t1")).toHaveAttribute("data-color", "teal")
    expect(screen.getByTestId("agenda-t2").getAttribute("data-color")).toMatch(/^[a-z]+$/)
  })

  it("adds a task for a company searched right there", async () => {
    companies.mockResolvedValue([
      { taxId: "30798765432", businessName: "Zeta SA" },
      { taxId: "30712345678", businessName: "Acmé SA" },
      { taxId: "30711111111", businessName: "Acme Norte SA" },
    ])
    createTask.mockResolvedValue({})
    await show()
    await userEvent.click(screen.getByRole("button", { name: "Nueva tarea" }))
    const submit = screen.getByRole("button", { name: "Agregar" })
    expect(submit).toBeDisabled()
    await userEvent.type(screen.getByLabelText("Empresa"), "acme")
    const found = within(await screen.findByRole("listbox", { name: "Empresas encontradas" }))
    expect(found.getAllByRole("option").map((option) => option.textContent)).toEqual(["Acme Norte SA30-71111111-1", "Acmé SA30-71234567-8"])
    await userEvent.click(found.getByRole("option", { name: /Acmé SA/ }))
    expect(screen.getByRole("button", { name: "Cambiar empresa" })).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText("Tarea"), "Llamar a Ana")
    await userEvent.type(screen.getByLabelText("Vence"), "2026-11-02")
    await userEvent.click(submit)
    expect(createTask).toHaveBeenCalledWith({
      companyTaxId: "30712345678",
      description: "Llamar a Ana",
      dueDate: "2026-11-02",
      assignee: null,
      contactIds: [],
    })
  })

  it("opens the company of a task", async () => {
    await show()
    await userEvent.click(screen.getByText("Tarea t2"))
    expect(navigate).toHaveBeenCalledWith("/crm/30712345678", { state: { from: "agenda" } })
  })

  it("keeps its header on top while scrolling", async () => {
    await show()
    expect(screen.getByTestId("crm-agenda-header")).toHaveClass("sticky", "top-0")
    expect(screen.getByRole("columnheader", { name: "Vence" })).toHaveClass("sticky")
  })
})
