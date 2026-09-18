import { describe, it, expect, beforeEach, vi } from "vitest"
import { act, type ReactNode } from "react"
import { waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook } from "@/tests/render"
import type { TrustLevelMembersResponse } from "@/types"

vi.mock("@/services/api", () => ({
  GraphService: {
    getTrustLevels: vi.fn(async () => []),
    getTrustLevelMembers: vi.fn(),
  },
}))

const { GraphService } = await import("@/services/api")
const { useTrustLevelMembers, trustLevelKeys } = await import("@/hooks/useTrustLevels")

const RESPONSE: TrustLevelMembersResponse = {
  level: { value: 4, label: "Interesante", color: "green", description: "", nodeCount: 1 },
  members: [
    {
      taxId: "30500904557",
      businessName: "CHAMMAS SOC RESP LTDA",
      sources: ["Bolsa"],
      relationshipCount: 0,
      isKnown: false,
      isToKnow: true,
      trustReason: "de cordoba",
    },
  ],
}

function withClient(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

describe("useTrustLevelMembers", () => {
  let client: QueryClient

  beforeEach(() => {
    vi.mocked(GraphService.getTrustLevelMembers).mockReset()
    vi.mocked(GraphService.getTrustLevelMembers).mockResolvedValue(RESPONSE)
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  })

  it("asks for the level it was given", async () => {
    const { result } = renderHook(() => useTrustLevelMembers(4), { wrapper: withClient(client) })
    await waitFor(() => expect(result.current.data).toEqual(RESPONSE))
    expect(GraphService.getTrustLevelMembers).toHaveBeenCalledWith(4)
  })

  it("does not call the API without a valid level", async () => {
    const { result } = renderHook(() => useTrustLevelMembers(null), { wrapper: withClient(client) })
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"))
    expect(GraphService.getTrustLevelMembers).not.toHaveBeenCalled()
  })

  it("keeps each level in its own cache entry", () => {
    expect(trustLevelKeys.members(4)).not.toEqual(trustLevelKeys.members(5))
  })

  it("files the members under the trust levels key, so refreshing the levels refreshes them", async () => {
    const { result } = renderHook(() => useTrustLevelMembers(4), { wrapper: withClient(client) })
    await waitFor(() => expect(result.current.data).toBeDefined())

    await act(async () => {
      await client.invalidateQueries({ queryKey: trustLevelKeys.all() })
    })

    expect(GraphService.getTrustLevelMembers).toHaveBeenCalledTimes(2)
  })
})
