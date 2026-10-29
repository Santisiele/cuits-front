import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@/tests/render"
import type { CrmAgendaItem } from "@/types"

const agenda = vi.fn()
const users = vi.fn()

vi.mock("@/services/api", () => ({
  CrmApiService: {
    agenda: (assignee: string) => agenda(assignee),
    users: () => users(),
  },
}))

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
    users.mockReset().mockResolvedValue(["flavia", "pedro"])
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

  it("opens the company of a task", async () => {
    await show()
    await userEvent.click(screen.getByText("Tarea t2"))
    expect(navigate).toHaveBeenCalledWith("/crm/30712345678")
  })
})
