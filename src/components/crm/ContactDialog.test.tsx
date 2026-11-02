import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@/tests/render"
import type { CrmContact } from "@/types"

const createContact = vi.fn()
const updateContact = vi.fn()

vi.mock("@/services/api", () => ({
  CrmApiService: {
    createContact: (input: unknown) => createContact(input),
    updateContact: (id: string, input: unknown) => updateContact(id, input),
  },
}))
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }))

const { ContactDialog } = await import("@/components/crm/ContactDialog")

const ANA: CrmContact = {
  id: "c1",
  fullName: "Ana",
  phone: null,
  email: "ana en gmail",
  birthday: null,
  cuil: "20301234567",
  companyTaxIds: ["30712345678"],
  createdAt: "",
  archivedAt: null,
}

function show(contact: CrmContact | null, onClose = vi.fn()) {
  const client = new QueryClient()
  render(
    <QueryClientProvider client={client}>
      <ContactDialog companyTaxId="30712345678" contact={contact} onClose={onClose} />
    </QueryClientProvider>
  )
  return onClose
}

describe("ContactDialog", () => {
  beforeEach(() => {
    createContact.mockReset().mockResolvedValue({})
    updateContact.mockReset().mockResolvedValue({})
  })

  it("keeps a CUIL already set locked and never sends it again", async () => {
    const onClose = show(ANA)
    expect(screen.getByLabelText("CUIL")).toBeDisabled()
    await userEvent.type(screen.getByLabelText("Teléfono"), "1144556677")
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(updateContact).toHaveBeenCalledWith("c1", { fullName: "Ana", phone: "1144556677", email: "ana en gmail", birthday: null })
  })

  it("checks a new CUIL before sending it with the contact", async () => {
    show(null)
    await userEvent.type(screen.getByLabelText("Nombre"), "Juan")
    await userEvent.type(screen.getByLabelText("CUIL"), "123")
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled()
    await userEvent.clear(screen.getByLabelText("CUIL"))
    await userEvent.type(screen.getByLabelText("CUIL"), "20-30123456-7")
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => expect(createContact).toHaveBeenCalled())
    expect(createContact.mock.calls[0]![0]).toMatchObject({ fullName: "Juan", cuil: "20301234567", companyTaxIds: ["30712345678"] })
  })
})
