import { describe, it, expect, beforeEach, vi } from "vitest"
import { act } from "react"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@/tests/render"
import { apiError } from "@/tests/apiError"
import type { CrmContact, CrmTask } from "@/types"

const recordAction = vi.fn()
const users = vi.fn()

vi.mock("@/services/api", () => ({
  CrmApiService: {
    recordAction: (...args: unknown[]) => recordAction(...args),
    users: () => users(),
  },
}))

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const { RecordActionDialog } = await import("@/components/crm/RecordActionDialog")
const { useAuthStore } = await import("@/store/useAuthStore")

const COMPANY = "30712345678"

const CONTACTS: CrmContact[] = [
  { id: "c1", fullName: "Ana Pérez", phone: null, email: null, birthday: null, cuil: null, companyTaxIds: [COMPANY], createdAt: "", archivedAt: null },
]

const OPEN_TASKS: CrmTask[] = [
  {
    id: "t1",
    companyTaxId: COMPANY,
    description: "Llamar a Ana",
    dueDate: "2026-10-30",
    status: "open",
    cancelReason: null,
    assignee: "flavia",
    createdBy: "santi",
    contactIds: [],
    createdAt: "",
    closedAt: null,
    archivedAt: null,
  },
]

const onClose = vi.fn()

function show(): void {
  act(() => useAuthStore.getState().setAuth("token", "flavia", "member"))
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <RecordActionDialog companyTaxId={COMPANY} contacts={CONTACTS} openTasks={OPEN_TASKS} onClose={onClose} />
    </QueryClientProvider>
  )
}

describe("RecordActionDialog", () => {
  beforeEach(() => {
    recordAction.mockReset().mockResolvedValue({ action: {}, closedTasks: [], nextTask: null })
    users.mockReset().mockResolvedValue([{ username: "flavia", color: null }, { username: "santi", color: null }])
    onClose.mockReset()
  })

  it("starts on today and keeps Registrar off until it knows what was done and the next task", async () => {
    show()
    expect((screen.getByLabelText("Fecha") as HTMLInputElement).value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    const submit = screen.getByRole("button", { name: "Registrar" })
    expect(submit).toBeDisabled()
    await userEvent.type(screen.getByLabelText("Qué se hizo"), "Lo llamé")
    expect(submit).toBeDisabled()
    await userEvent.type(screen.getByLabelText("Tarea"), "Mandar propuesta")
    await userEvent.type(screen.getByLabelText("Vence"), "2026-11-02")
    expect(submit).toBeEnabled()
  })

  it("never lets the chain end: the next task cannot be skipped", async () => {
    show()
    expect(screen.queryByLabelText("Agendar próxima tarea")).not.toBeInTheDocument()
    await userEvent.type(screen.getByLabelText("Qué se hizo"), "Lo llamé")
    expect(screen.getByRole("button", { name: "Registrar" })).toBeDisabled()
  })

  it("starts with the open tasks ticked as fulfilled", () => {
    show()
    expect(screen.getByLabelText(/Llamar a Ana/)).toBeChecked()
  })

  it("sends the contacts, the tasks it fulfils and the next task assigned to me by default", async () => {
    show()
    await screen.findByRole("option", { name: "santi" })
    await userEvent.type(screen.getByLabelText("Qué se hizo"), "  Lo llamé  ")
    await userEvent.click(screen.getAllByLabelText("Ana Pérez")[0]!)
    await userEvent.type(screen.getByLabelText("Tarea"), "Mandar propuesta")
    await userEvent.type(screen.getByLabelText("Vence"), "2026-11-02")
    await userEvent.click(screen.getByRole("button", { name: "Registrar" }))
    expect(recordAction).toHaveBeenCalledWith({
      companyTaxId: COMPANY,
      date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      description: "Lo llamé",
      contactIds: ["c1"],
      completesTaskIds: ["t1"],
      nextTask: { description: "Mandar propuesta", dueDate: "2026-11-02", assignee: "flavia", contactIds: [] },
    })
  })

  it("shows what the API answered when it refuses", async () => {
    recordAction.mockRejectedValue(apiError("La tarea ya no está abierta"))
    show()
    await userEvent.type(screen.getByLabelText("Qué se hizo"), "Lo llamé")
    await userEvent.type(screen.getByLabelText("Tarea"), "Seguir")
    await userEvent.type(screen.getByLabelText("Vence"), "2026-11-02")
    await userEvent.click(screen.getByRole("button", { name: "Registrar" }))
    expect(await screen.findByText("La tarea ya no está abierta")).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })
})
