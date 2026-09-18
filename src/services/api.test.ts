import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { GraphService, ApiError } from "@/services/api"
import { useAuthStore } from "@/store/useAuthStore"
import type { TrustLevelMembersResponse } from "@/types"

const BODY: TrustLevelMembersResponse = {
  level: { value: 4, label: "Interesante", color: "green", description: "", nodeCount: 0 },
  members: [],
}

function answer(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
}

describe("GraphService.getTrustLevelMembers", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal("fetch", fetchMock)
    useAuthStore.getState().setAuth("token-123", "santi")
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    useAuthStore.getState().clearAuth()
  })

  it("filters on the level through the query string", async () => {
    fetchMock.mockResolvedValue(answer(200, BODY))
    await GraphService.getTrustLevelMembers(4)
    expect(String(fetchMock.mock.calls[0]![0])).toMatch(/\/trust-levels\/nodes\?level=4$/)
  })

  it("sends the session token", async () => {
    fetchMock.mockResolvedValue(answer(200, BODY))
    await GraphService.getTrustLevelMembers(4)
    const headers = fetchMock.mock.calls[0]![1].headers as Headers
    expect(headers.get("Authorization")).toBe("Bearer token-123")
  })

  it("returns the level and its members as the API sent them", async () => {
    fetchMock.mockResolvedValue(answer(200, BODY))
    expect(await GraphService.getTrustLevelMembers(4)).toEqual(BODY)
  })

  it("turns a refusal into a Spanish error", async () => {
    fetchMock.mockResolvedValue(
      answer(400, { error: "reserved_level", message: "There is no list for level 0, which stands for having no level" })
    )
    const error = await GraphService.getTrustLevelMembers(0).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).message).toBe("El nivel 0 es la ausencia de nivel: no tiene lista de CUITs")
  })

  it("keeps the English original for code that branches on it", async () => {
    fetchMock.mockResolvedValue(answer(404, { error: "level_not_found", message: "That trust level does not exist" }))
    const error = (await GraphService.getTrustLevelMembers(99).catch((e: unknown) => e)) as ApiError
    expect(error.message).toBe("Ese nivel no existe")
    expect(error.rawMessage).toBe("That trust level does not exist")
  })
})
