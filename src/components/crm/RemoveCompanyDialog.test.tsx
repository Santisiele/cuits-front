import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@/tests/render"

const removeCompany = vi.fn()
const navigate = vi.fn()

vi.mock("@/services/api", () => ({ CrmApiService: { removeCompany: (taxId: string, dryRun: boolean) => removeCompany(taxId, dryRun) } }))
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }))
vi.mock("react-router-dom", () => ({ useNavigate: () => navigate }))

const { RemoveCompanyDialog } = await import("@/components/crm/RemoveCompanyDialog")

function show(onClose = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <RemoveCompanyDialog taxId="30712345678" businessName="ACME SA" onClose={onClose} />
    </QueryClientProvider>
  )
  return onClose
}

describe("RemoveCompanyDialog", () => {
  beforeEach(() => {
    removeCompany.mockReset()
    navigate.mockReset()
  })

  it("says what will happen before removing, and only removes on confirm", async () => {
    removeCompany.mockResolvedValue({ outcome: "archived", cancelledTaskCount: 2, dryRun: true })
    const onClose = show()
    expect(await screen.findByText(/Se cancelan sus 2 tareas abiertas/)).toBeInTheDocument()
    expect(removeCompany).toHaveBeenCalledTimes(1)
    expect(removeCompany).toHaveBeenCalledWith("30712345678", true)
    await userEvent.click(screen.getByRole("button", { name: "Sacar del CRM" }))
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/crm"))
    expect(removeCompany).toHaveBeenLastCalledWith("30712345678", false)
    expect(onClose).toHaveBeenCalled()
  })

  it("can be cancelled while the preview is still being worked out", async () => {
    removeCompany.mockReturnValue(new Promise(() => {}))
    const onClose = show()
    expect(screen.getByText("Calculando...")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sacar del CRM" })).toBeDisabled()
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }))
    expect(onClose).toHaveBeenCalled()
  })
})
