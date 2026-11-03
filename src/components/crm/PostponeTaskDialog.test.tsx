import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@/tests/render"
import type { CrmTask } from "@/types"

const postponeTask = vi.fn()

vi.mock("@/services/api", () => ({ CrmApiService: { postponeTask: (id: string, input: unknown) => postponeTask(id, input) } }))
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }))

const { PostponeTaskDialog } = await import("@/components/crm/PostponeTaskDialog")
const { Postponements } = await import("@/components/crm/Postponements")

const TASK: CrmTask = {
  id: "t1",
  companyTaxId: "30712345678",
  description: "Llamar",
  dueDate: "2026-11-02",
  status: "open",
  cancelReason: null,
  assignee: "Raul",
  createdBy: "sol",
  contactIds: [],
  createdAt: "",
  closedAt: null,
  archivedAt: null,
  postponements: [],
}

function show(onClose = vi.fn()) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PostponeTaskDialog task={TASK} onClose={onClose} />
    </QueryClientProvider>
  )
  return onClose
}

describe("PostponeTaskDialog", () => {
  beforeEach(() => {
    postponeTask.mockReset().mockResolvedValue({})
  })

  it("only takes a later date and sends it with the reason", async () => {
    const onClose = show()
    const submit = screen.getByRole("button", { name: "Posponer" })
    await userEvent.type(screen.getByLabelText("Nueva fecha"), "2026-11-01")
    expect(submit).toBeDisabled()
    expect(screen.getByText("Elegí una fecha posterior a la actual")).toBeInTheDocument()
    await userEvent.clear(screen.getByLabelText("Nueva fecha"))
    await userEvent.type(screen.getByLabelText("Nueva fecha"), "2026-11-09")
    await userEvent.type(screen.getByLabelText("Motivo (opcional)"), "De viaje")
    await userEvent.click(submit)
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(postponeTask).toHaveBeenCalledWith("t1", { dueDate: "2026-11-09", reason: "De viaje" })
  })
})

describe("Postponements", () => {
  it("shows how many times a task moved and each move apart", async () => {
    render(
      <Postponements
        postponements={[
          { from: "2026-11-02", to: "2026-11-09", reason: "De viaje", by: "sol", at: "2026-11-01T12:00:00.000Z" },
          { from: "2026-11-09", to: "2026-11-16", reason: null, by: "luchi", at: "2026-11-08T12:00:00.000Z" },
        ]}
      />
    )
    await userEvent.click(screen.getByRole("button", { name: "Pospuesta 2 veces" }))
    const items = screen.getAllByRole("listitem").map((item) => item.textContent)
    expect(items[0]).toContain("del 09/11/2026 al 16/11/2026")
    expect(items[1]).toContain("De viaje")
  })

  it("shows nothing for a task never postponed", () => {
    render(<Postponements postponements={[]} />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})
