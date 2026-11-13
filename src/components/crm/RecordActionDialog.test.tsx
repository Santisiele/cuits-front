import { describe, it, expect, beforeEach, vi } from "vitest"
import { act } from "react"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@/tests/render"
import { apiError } from "@/tests/apiError"
import type { CrmAction, CrmContact, CrmTask } from "@/types"

const recordAction = vi.fn()
const responsibles = vi.fn()

vi.mock("@/services/api", () => ({
  CrmApiService: {
    recordAction: (...args: unknown[]) => recordAction(...args),
    responsibles: () => responsibles(),
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
    postponements: [],
  },
]

const onClose = vi.fn()

function show(
  completing: CrmTask | null = null,
  openTasks: CrmTask[] = OPEN_TASKS,
  contacts: CrmContact[] = CONTACTS,
  actions: CrmAction[] = []
): void {
  act(() => useAuthStore.getState().setAuth("token", "flavia", "member"))
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <RecordActionDialog companyTaxId={COMPANY} contacts={contacts} openTasks={openTasks} actions={actions} completing={completing} onClose={onClose} />
    </QueryClientProvider>
  )
}

describe("RecordActionDialog", () => {
  beforeEach(() => {
    recordAction.mockReset().mockResolvedValue({ action: {}, closedTasks: [], nextTask: null })
    responsibles.mockReset().mockResolvedValue([
      { name: "Flavia", color: "green", users: ["flavia"], disabled: false },
      { name: "Raul", color: "sky-500", users: [], disabled: false },
    ])
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
    await screen.findAllByRole("option", { name: "Raul" })
    expect(screen.getByLabelText("Quién lo hizo")).toHaveValue("Flavia")
    expect(screen.getByLabelText("Quién lo hará")).toHaveValue("Flavia")
    expect(submit).toBeEnabled()
  })

  it("lets Sol pick who did it and who will do the next one", async () => {
    show()
    await screen.findAllByRole("option", { name: "Raul" })
    await userEvent.selectOptions(screen.getByLabelText("Quién lo hizo"), "Raul")
    await userEvent.selectOptions(screen.getByLabelText("Quién lo hará"), "Raul")
    await userEvent.type(screen.getByLabelText("Qué se hizo"), "Lo llamó Raul")
    await userEvent.type(screen.getByLabelText("Tarea"), "Seguir")
    await userEvent.type(screen.getByLabelText("Vence"), "2026-11-02")
    await userEvent.click(screen.getByRole("button", { name: "Registrar" }))
    expect(recordAction).toHaveBeenCalledWith(
      expect.objectContaining({ doneBy: "Raul", nextTask: expect.objectContaining({ assignee: "Raul" }) })
    )
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

  it("sends the only contact already ticked, the tasks it fulfils and the next task assigned to me by default", async () => {
    show()
    await screen.findAllByRole("option", { name: "Raul" })
    await userEvent.type(screen.getByLabelText("Qué se hizo"), "  Lo llamé  ")
    await userEvent.type(screen.getByLabelText("Tarea"), "Mandar propuesta")
    await userEvent.type(screen.getByLabelText("Vence"), "2026-11-02")
    await userEvent.click(screen.getByRole("button", { name: "Registrar" }))
    expect(recordAction).toHaveBeenCalledWith({
      companyTaxId: COMPANY,
      doneBy: "Flavia",
      date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      description: "Lo llamé",
      contactIds: ["c1"],
      completesTaskIds: ["t1"],
      nextTask: { description: "Mandar propuesta", dueDate: "2026-11-02", assignee: "Flavia", contactIds: ["c1"] },
    })
  })

  it("opened from a task, fulfils only that one and keeps its contacts and responsible", async () => {
    const other = { ...OPEN_TASKS[0]!, id: "t2", description: "Mandar mail", assignee: "Raul" }
    const task = { ...OPEN_TASKS[0]!, assignee: "Flavia", contactIds: ["c1"] }
    show(task, [task, other])
    await screen.findAllByRole("option", { name: "Raul" })
    expect(screen.queryByText("Tareas que cumple")).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Mandar mail/)).not.toBeInTheDocument()
    await userEvent.type(screen.getByLabelText("Qué se hizo"), "Lo llamé")
    await userEvent.type(screen.getByLabelText("Tarea"), "Seguir")
    await userEvent.type(screen.getByLabelText("Vence"), "2026-11-20")
    await userEvent.click(screen.getByRole("button", { name: "Registrar" }))
    expect(recordAction).toHaveBeenCalledWith(
      expect.objectContaining({
        contactIds: ["c1"],
        completesTaskIds: ["t1"],
        nextTask: { description: "Seguir", dueDate: "2026-11-20", assignee: "Flavia", contactIds: ["c1"] },
      })
    )
  })

  it("opened from a task, leaves out a contact of that task that is no longer listed", async () => {
    const task = { ...OPEN_TASKS[0]!, assignee: "Flavia", contactIds: ["c1", "archived"] }
    show(task, [task])
    await screen.findAllByRole("option", { name: "Raul" })
    await userEvent.type(screen.getByLabelText("Qué se hizo"), "Lo llamé")
    await userEvent.type(screen.getByLabelText("Tarea"), "Seguir")
    await userEvent.type(screen.getByLabelText("Vence"), "2026-11-20")
    await userEvent.click(screen.getByRole("button", { name: "Registrar" }))
    expect(recordAction).toHaveBeenCalledWith(
      expect.objectContaining({
        contactIds: ["c1"],
        nextTask: expect.objectContaining({ contactIds: ["c1"] }),
      })
    )
  })

  it("opened from a task without contacts, ticks the people of the action that created it", async () => {
    const two = [CONTACTS[0]!, { ...CONTACTS[0]!, id: "c2", fullName: "Beto Ruiz" }]
    const task = { ...OPEN_TASKS[0]!, contactIds: [] }
    const action = { id: "a1", companyTaxId: COMPANY, date: "2026-10-01", description: "Lo llamé", doneBy: "Flavia", recordedBy: "flavia", contactIds: ["c2"], createdTaskId: task.id, completedTaskIds: [], createdAt: "", archivedAt: null }
    show(task, [task], two, [action])
    await screen.findAllByRole("option", { name: "Raul" })
    const [actionBeto, nextBeto] = screen.getAllByLabelText("Beto Ruiz")
    expect(actionBeto).toBeChecked()
    expect(nextBeto).toBeChecked()
    expect(screen.getAllByLabelText("Ana Pérez")[0]).not.toBeChecked()
  })

  it("keeps the next task with the same people until they are chosen there", async () => {
    const two = [CONTACTS[0]!, { ...CONTACTS[0]!, id: "c2", fullName: "Beto Ruiz" }]
    show(null, OPEN_TASKS, two)
    await screen.findAllByRole("option", { name: "Raul" })
    const [actionAna, nextAna] = screen.getAllByLabelText("Ana Pérez")
    const [, nextBeto] = screen.getAllByLabelText("Beto Ruiz")
    expect(actionAna).not.toBeChecked()
    await userEvent.click(actionAna!)
    expect(nextAna).toBeChecked()
    await userEvent.click(nextBeto!)
    await userEvent.click(actionAna!)
    expect(nextAna).toBeChecked()
    expect(nextBeto).toBeChecked()
  })

  it("shows what the API answered when it refuses", async () => {
    recordAction.mockRejectedValue(apiError("La tarea ya no está abierta"))
    show()
    await screen.findAllByRole("option", { name: "Raul" })
    await userEvent.type(screen.getByLabelText("Qué se hizo"), "Lo llamé")
    await userEvent.type(screen.getByLabelText("Tarea"), "Seguir")
    await userEvent.type(screen.getByLabelText("Vence"), "2026-11-02")
    await userEvent.click(screen.getByRole("button", { name: "Registrar" }))
    expect(await screen.findByText("La tarea ya no está abierta")).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })
})
