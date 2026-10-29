import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@/tests/render"

const read = vi.fn()

vi.mock("@/services/api", () => ({
  ActivityService: { read: (filters: unknown) => read(filters) },
  UsersService: { list: async () => [{ username: "sol" }, { username: "luchi" }] },
}))

const { ActivityScreen } = await import("@/components/activity/ActivityScreen")

function show(): void {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <ActivityScreen />
    </QueryClientProvider>
  )
}

describe("ActivityScreen", () => {
  beforeEach(() => {
    read.mockReset()
    read.mockImplementation(async (filters: { before?: string }) =>
      filters.before
        ? { entries: [{ time: "2026-10-29T10:00:00.000Z", level: "info", event: "logout", username: "sol", details: {} }], hasMore: false }
        : {
            entries: [
              { time: "2026-10-29T12:00:00.000Z", level: "warn", event: "forbidden", username: "sol", details: { url: "/users" } },
              { time: "2026-10-29T11:00:00.000Z", level: "info", event: "login", username: "sol", details: {} },
            ],
            hasMore: true,
          }
    )
  })

  it("lists the log in Spanish, newest first, and marks warnings", async () => {
    show()
    expect(await screen.findByText("sol intentó entrar a /users sin permiso")).toBeInTheDocument()
    expect(screen.getAllByTestId("activity-entry")).toHaveLength(2)
    expect(screen.getByText("Aviso")).toBeInTheDocument()
  })

  it("loads older entries from the last one shown", async () => {
    show()
    await userEvent.click(await screen.findByRole("button", { name: "Ver más" }))
    expect(await screen.findByText("sol cerró sesión")).toBeInTheDocument()
    expect(read).toHaveBeenLastCalledWith({ username: "", event: "", before: "2026-10-29T11:00:00.000Z", seen: 1 })
    expect(screen.queryByRole("button", { name: "Ver más" })).not.toBeInTheDocument()
  })

  it("filters by user and kind", async () => {
    show()
    await screen.findAllByTestId("activity-entry")
    await screen.findByRole("option", { name: "sol" })
    expect(screen.getAllByRole("option", { name: /^(luchi|sol)$/ }).map((option) => option.textContent)).toEqual(["luchi", "sol"])
    await userEvent.selectOptions(screen.getByLabelText("Usuario"), "sol")
    await userEvent.selectOptions(screen.getByLabelText("Tipo"), "CRM")
    expect(read).toHaveBeenLastCalledWith({ username: "sol", event: "crm_operation" })
  })
})
