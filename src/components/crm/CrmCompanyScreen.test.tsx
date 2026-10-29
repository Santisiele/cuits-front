import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { render } from "@/tests/render"
import type { CrmCompanyDetail } from "@/types"

const company = vi.fn()
const archiveContact = vi.fn()
const restoreContact = vi.fn()
const success = vi.fn()

vi.mock("@/services/api", () => ({
  CrmApiService: {
    company: (taxId: string) => company(taxId),
    responsibles: async () => [],
    sources: async () => [],
    archiveContact: (id: string) => archiveContact(id),
    restoreContact: (id: string) => restoreContact(id),
  },
}))

vi.mock("sonner", () => ({ toast: { success: (...args: unknown[]) => success(...args), error: vi.fn() } }))

const { CrmCompanyScreen } = await import("@/components/crm/CrmCompanyScreen")

const DETAIL: CrmCompanyDetail = {
  company: {
    taxId: "30712345678",
    businessName: "ACME SA",
    crmBrand: "Acme",
    crmProduct: null,
    crmOrigin: "Referido",
    originSource: null,
    nosisPending: false,
    addedAt: null,
    addedBy: null,
    lastActionDate: null,
    nextDueDate: null,
    openTaskCount: 0,
    closedAt: null,
    closedReason: null,
    closedBy: null,
  },
  contacts: [
    {
      id: "c1",
      fullName: "Ana",
      phone: null,
      email: null,
      birthday: null,
      cuil: null,
      companyTaxIds: ["30712345678"],
      createdAt: "",
      archivedAt: null,
    },
  ],
  actions: [],
  tasks: [],
}

async function show(): Promise<void> {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/crm/30712345678"]}>
        <Routes>
          <Route path="/crm/:taxId" element={<CrmCompanyScreen />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
  await screen.findByText("ACME SA")
}

describe("CrmCompanyScreen", () => {
  beforeEach(() => {
    company.mockReset().mockResolvedValue(DETAIL)
    archiveContact.mockReset().mockResolvedValue({})
    restoreContact.mockReset().mockResolvedValue({})
    success.mockReset()
  })

  it("throws away what was typed when the edit is cancelled", async () => {
    await show()
    await userEvent.click(screen.getByRole("button", { name: "Editar datos" }))
    await userEvent.clear(screen.getByLabelText("Marca"))
    await userEvent.type(screen.getByLabelText("Marca"), "Otra")
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }))
    await userEvent.click(screen.getByRole("button", { name: "Editar datos" }))
    expect(screen.getByLabelText("Marca")).toHaveValue("Acme")
  })

  it("offers to undo archiving a contact", async () => {
    await show()
    await userEvent.click(screen.getByRole("button", { name: "Archivar Ana" }))
    await waitFor(() => expect(success).toHaveBeenCalled())
    expect(archiveContact).toHaveBeenCalledWith("c1")
    const [message, options] = success.mock.calls[0] as [string, { action: { label: string; onClick: () => void } }]
    expect(message).toBe("Se archivó a Ana")
    expect(options.action.label).toBe("Deshacer")
    options.action.onClick()
    await waitFor(() => expect(restoreContact).toHaveBeenCalledWith("c1"))
  })
})
