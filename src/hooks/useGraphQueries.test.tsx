import { describe, it, expect, beforeEach, vi } from "vitest"
import { act, type ReactNode } from "react"
import { waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook } from "@/tests/render"

vi.mock("@/services/api", () => ({
  GraphService: {
    updateNode: vi.fn(async () => ({ message: "ok" })),
  },
}))

const { useUpdateNode } = await import("@/hooks/useGraphQueries")

function withClient(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

function invalidatedKeys(spy: { mock: { calls: unknown[][] } }): unknown[] {
  return spy.mock.calls.map((call) => (call[0] as { queryKey: unknown }).queryKey)
}

describe("useUpdateNode", () => {
  let client: QueryClient

  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  })

  async function saveLevel() {
    const spy = vi.spyOn(client, "invalidateQueries")
    const { result } = renderHook(() => useUpdateNode("30500904557"), { wrapper: withClient(client) })
    await act(async () => {
      await result.current.mutateAsync({ levelOfTrust: 4, trustReason: "de cordoba" })
    })
    await waitFor(() => expect(spy).toHaveBeenCalled())
    return spy
  }

  it("refreshes the trust levels, whose counts just changed", async () => {
    const spy = await saveLevel()
    expect(invalidatedKeys(spy)).toContainEqual(["trustLevels"])
  })

  it("still refreshes the node it saved", async () => {
    const spy = await saveLevel()
    expect(invalidatedKeys(spy)).toContainEqual(["node", "30500904557"])
  })

  it("leaves the trust levels alone when the save fails", async () => {
    const { GraphService } = await import("@/services/api")
    vi.mocked(GraphService.updateNode).mockRejectedValueOnce(new Error("no"))
    const spy = vi.spyOn(client, "invalidateQueries")
    const { result } = renderHook(() => useUpdateNode("30500904557"), { wrapper: withClient(client) })
    await act(async () => {
      await result.current.mutateAsync({ levelOfTrust: 4, trustReason: "x" }).catch(() => undefined)
    })
    expect(invalidatedKeys(spy)).not.toContainEqual(["trustLevels"])
  })
})
