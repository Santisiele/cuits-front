import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@/tests/render"
import type { CrmAgendaItem } from "@/types"

const agenda = vi.fn()
const responsibles = vi.fn()
const companies = vi.fn()
const createTask = vi.fn()

vi.mock("@/services/api", () => ({
  CrmApiService: {
    agenda: (assignee: string) => agenda(assignee),
    responsibles: () => responsibles(),
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
    lastAction: id === "t1" ? { date: "2026-10-20", description: "Con Ana: mandó propuesta", doneBy: "Luchi", contacts: [] } : null,
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
    responsibles.mockReset().mockResolvedValue([
      { name: "flavia", color: "green", users: ["flavia"], disabled: false },
      { name: "pedro", color: "sky-500", users: [], disabled: false },
      { name: "Viejo", color: "red", users: [], disabled: true },
    ])
    navigate.mockReset()
  })

  it("asks for everybody's tasks first and keeps the order the API gives", async () => {
    await show()
    expect(agenda).toHaveBeenCalledWith("all")
    const rows = screen.getAllByTestId(/^agenda-/)
    expect(rows.map((row) => row.getAttribute("data-testid"))).toEqual(["agenda-t1", "agenda-t2"])
  })

  it("shows the last thing done next to what comes next, like the sheet", async () => {
    await show()
    const row = within(screen.getByTestId("agenda-t1"))
    expect(row.getByText("Ana")).toBeInTheDocument()
    expect(row.getByText("20/10/2026")).toBeInTheDocument()
    expect(row.getByText("mandó propuesta")).toBeInTheDocument()
    expect(row.getByText("Luchi")).toBeInTheDocument()
    expect(row.getByText("28/10/2026")).toBeInTheDocument()
    expect(within(screen.getByTestId("agenda-t2")).getAllByText("—")).toHaveLength(4)
  })

  it("marks the overdue ones", async () => {
    await show()
    expect(within(screen.getByTestId("agenda-t1")).getByText("Vencida")).toBeInTheDocument()
    expect(within(screen.getByTestId("agenda-t2")).queryByText("Vencida")).not.toBeInTheDocument()
  })

  it("shows all, only the overdue or only the upcoming ones, with their counts", async () => {
    await show()
    await userEvent.click(screen.getByRole("button", { name: "Vencidas (1)" }))
    expect(screen.getByTestId("agenda-t1")).toBeInTheDocument()
    expect(screen.queryByTestId("agenda-t2")).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Próximas (1)" }))
    expect(screen.queryByTestId("agenda-t1")).not.toBeInTheDocument()
    expect(screen.getByTestId("agenda-t2")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Todas" }))
    expect(screen.getAllByTestId(/^agenda-t/)).toHaveLength(2)
  })

  it("switches to someone else's tasks or mine", async () => {
    await show()
    await screen.findByRole("option", { name: "pedro" })
    await userEvent.selectOptions(screen.getByLabelText("Responsable"), "pedro")
    expect(agenda).toHaveBeenLastCalledWith("pedro")
    await userEvent.selectOptions(screen.getByLabelText("Responsable"), "Mis tareas")
    expect(agenda).toHaveBeenLastCalledWith("me")
  })

  it("paints each task with its responsible's color and offers only active responsibles", async () => {
    await show()
    await screen.findByRole("option", { name: "pedro" })
    expect(screen.getByTestId("agenda-t1")).toHaveAttribute("data-color", "green")
    expect(screen.getByTestId("agenda-t2")).toHaveAttribute("data-color", "sky-500")
    expect(screen.queryByRole("option", { name: "Viejo" })).not.toBeInTheDocument()
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
    expect(submit).toBeDisabled()
    await userEvent.selectOptions(screen.getByLabelText("Quién lo hará"), "pedro")
    await userEvent.click(submit)
    expect(createTask).toHaveBeenCalledWith({
      companyTaxId: "30712345678",
      description: "Llamar a Ana",
      dueDate: "2026-11-02",
      assignee: "pedro",
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
    expect(screen.getByRole("columnheader", { name: "Fecha próxima acción" })).toHaveClass("sticky")
  })
})
