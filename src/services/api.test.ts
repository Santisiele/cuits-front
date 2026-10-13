import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { GraphService, ApiError, UsersService, AuthApiService, ResearchService, BirthdayProgressService } from "@/services/api"
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
    useAuthStore.getState().setAuth("token-123", "santi", "admin")
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

  it("translates by the error code and keeps it", async () => {
    fetchMock.mockResolvedValue(answer(403, { error: "forbidden", message: "Only an admin can do this" }))
    const error = (await GraphService.getTrustLevelMembers(4).catch((e: unknown) => e)) as ApiError
    expect(error.message).toBe("No tenés permiso para esto")
    expect(error.code).toBe("forbidden")
    expect(useAuthStore.getState().token).toBe("token-123")
  })

  it("keeps the English original for code that branches on it", async () => {
    fetchMock.mockResolvedValue(answer(404, { error: "level_not_found", message: "That trust level does not exist" }))
    const error = (await GraphService.getTrustLevelMembers(99).catch((e: unknown) => e)) as ApiError
    expect(error.message).toBe("Ese nivel no existe")
    expect(error.rawMessage).toBe("That trust level does not exist")
  })
})

describe("UsersService", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal("fetch", fetchMock)
    useAuthStore.getState().setAuth("token-123", "santi", "creator")
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    useAuthStore.getState().clearAuth()
  })

  it("lists the users", async () => {
    fetchMock.mockResolvedValue(answer(200, { users: [] }))
    expect(await UsersService.list()).toEqual([])
    expect(String(fetchMock.mock.calls[0]![0])).toMatch(/\/users$/)
  })

  it("creates a user with the role it was given", async () => {
    fetchMock.mockResolvedValue(answer(201, {}))
    await UsersService.create("ana", "12345678", "member")
    expect(fetchMock.mock.calls[0]![1].method).toBe("POST")
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toEqual({ username: "ana", password: "12345678", role: "member" })
  })

  it("changes a user by its encoded name", async () => {
    fetchMock.mockResolvedValue(answer(200, {}))
    await UsersService.update("ana.b", { disabled: true })
    expect(String(fetchMock.mock.calls[0]![0])).toMatch(/\/users\/ana\.b$/)
    expect(fetchMock.mock.calls[0]![1].method).toBe("PATCH")
  })

  it("resets a password", async () => {
    fetchMock.mockResolvedValue(answer(200, { message: "Password reset" }))
    await UsersService.resetPassword("ana", "12345678")
    expect(String(fetchMock.mock.calls[0]![0])).toMatch(/\/users\/ana\/password$/)
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toEqual({ password: "12345678" })
  })

  it("turns a taken username into Spanish", async () => {
    fetchMock.mockResolvedValue(answer(409, { error: "username_taken", message: 'User "ana" already exists' }))
    const error = await UsersService.create("ana", "12345678", "member").catch((e: unknown) => e)
    expect((error as Error).message).toBe("Ese usuario ya existe")
  })
})

describe("AuthApiService.changePassword", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal("fetch", fetchMock)
    useAuthStore.getState().setAuth("token-123", "ana", "member")
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    useAuthStore.getState().clearAuth()
  })

  it("sends both passwords", async () => {
    fetchMock.mockResolvedValue(answer(200, { message: "Password changed" }))
    await AuthApiService.changePassword("vieja-clave", "nueva-clave")
    expect(String(fetchMock.mock.calls[0]![0])).toMatch(/\/auth\/password$/)
    expect(fetchMock.mock.calls[0]![1].method).toBe("PATCH")
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toEqual({
      currentPassword: "vieja-clave",
      newPassword: "nueva-clave",
    })
  })

  it("keeps the session on a wrong current password", async () => {
    fetchMock.mockResolvedValue(answer(400, { error: "wrong_password", message: "Current password is wrong" }))
    const error = await AuthApiService.changePassword("mala", "nueva-clave").catch((e: unknown) => e)
    expect((error as Error).message).toBe("La contraseña actual es incorrecta")
    expect(useAuthStore.getState().token).toBe("token-123")
  })
})

describe("ResearchService", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal("fetch", fetchMock)
    useAuthStore.getState().setAuth("token-123", "santi", "creator")
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    useAuthStore.getState().clearAuth()
  })

  it("asks for a new research with a POST", async () => {
    fetchMock.mockResolvedValue(answer(201, { id: "r1" }))
    await ResearchService.run("30501677643")
    expect(String(fetchMock.mock.calls[0]![0])).toMatch(/\/research\/30501677643$/)
    expect(fetchMock.mock.calls[0]![1].method).toBe("POST")
  })

  it("reads the history of a CUIT", async () => {
    fetchMock.mockResolvedValue(answer(200, { research: [{ id: "r1" }] }))
    expect(await ResearchService.history("30501677643")).toEqual([{ id: "r1" }])
  })

  it("reads the recent research", async () => {
    fetchMock.mockResolvedValue(answer(200, { research: [] }))
    expect(await ResearchService.recent()).toEqual([])
    expect(String(fetchMock.mock.calls[0]![0])).toMatch(/\/research\/recent$/)
  })

  it("reads the budget", async () => {
    const budget = { monthlyLimitUsd: 20, spentThisMonthUsd: 1.5, researchCountThisMonth: 3 }
    fetchMock.mockResolvedValue(answer(200, budget))
    expect(await ResearchService.budget()).toEqual(budget)
  })

  it("changes the limit", async () => {
    fetchMock.mockResolvedValue(answer(200, {}))
    await ResearchService.setLimit(12.5)
    expect(fetchMock.mock.calls[0]![1].method).toBe("PATCH")
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toEqual({ monthlyLimitUsd: 12.5 })
  })

  it("turns a spent budget into Spanish", async () => {
    fetchMock.mockResolvedValue(answer(409, { error: "budget_exhausted", message: "The monthly budget is spent" }))
    const error = await ResearchService.run("30501677643").catch((e: unknown) => e)
    expect((error as Error).message).toBe("Se alcanzó el tope de gasto del mes")
  })
})

describe("BirthdayProgressService", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal("fetch", fetchMock)
    useAuthStore.getState().setAuth("token-123", "santi", "creator")
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    useAuthStore.getState().clearAuth()
  })

  it("reads the progress of the birthday sweep", async () => {
    fetchMock.mockResolvedValue(answer(200, { knownPeople: 2 }))
    expect(await BirthdayProgressService.get()).toEqual({ knownPeople: 2 })
    expect(String(fetchMock.mock.calls[0]![0])).toMatch(/\/birthdays\/progress$/)
  })

  it("turns a refusal into Spanish", async () => {
    fetchMock.mockResolvedValue(answer(403, { error: "forbidden", message: "Only the creator can do this" }))
    const error = await BirthdayProgressService.get().catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as Error).message).toBe("No tenés permiso para esto")
  })
})
