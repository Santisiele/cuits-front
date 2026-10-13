import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { act } from "react"
import { renderHook } from "@/tests/render"

const me = vi.fn()

vi.mock("@/services/api", () => ({ AuthApiService: { me: () => me() } }))

const { useSessionRole, useIsAdmin } = await import("@/hooks/useSessionRole")
const { useAuthStore } = await import("@/store/useAuthStore")

async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe("useSessionRole", () => {
  beforeEach(() => {
    me.mockReset()
  })

  afterEach(() => {
    act(() => useAuthStore.getState().clearAuth())
  })

  it("asks who is logged in and keeps the role", async () => {
    me.mockResolvedValue({ username: "santi", role: "member" })
    act(() => useAuthStore.getState().setAuth("t1", "santi", null))
    renderHook(() => useSessionRole())
    await flush()
    expect(useAuthStore.getState().role).toBe("member")
  })

  it("corrects a role that changed since the last visit", async () => {
    me.mockResolvedValue({ username: "santi", role: "member" })
    act(() => useAuthStore.getState().setAuth("t1", "santi", "admin"))
    renderHook(() => useSessionRole())
    await flush()
    expect(useAuthStore.getState().role).toBe("member")
  })

  it("asks nothing without a session", async () => {
    renderHook(() => useSessionRole())
    await flush()
    expect(me).not.toHaveBeenCalled()
  })

  it("keeps the stored role when the call fails", async () => {
    me.mockRejectedValue(new Error("down"))
    act(() => useAuthStore.getState().setAuth("t1", "santi", "admin"))
    renderHook(() => useSessionRole())
    await flush()
    expect(useAuthStore.getState().role).toBe("admin")
  })

  it("ignores an answer for a session that is already gone", async () => {
    let answer: (value: unknown) => void = () => undefined
    me.mockReturnValueOnce(new Promise((resolve) => (answer = resolve)))
    me.mockResolvedValueOnce({ username: "otro", role: "member" })
    act(() => useAuthStore.getState().setAuth("t1", "santi", null))
    renderHook(() => useSessionRole())
    act(() => useAuthStore.getState().setAuth("t2", "otro", "member"))
    answer({ username: "santi", role: "admin" })
    await flush()
    expect(useAuthStore.getState().role).toBe("member")
  })
})

describe("useIsAdmin", () => {
  afterEach(() => {
    act(() => useAuthStore.getState().clearAuth())
  })

  it("counts the creator as an admin", () => {
    act(() => useAuthStore.getState().setAuth("t1", "santi", "creator"))
    const { result } = renderHook(() => useIsAdmin())
    expect(result.current).toBe(true)
  })

  it("follows the stored role", () => {
    act(() => useAuthStore.getState().setAuth("t1", "santi", "admin"))
    const { result } = renderHook(() => useIsAdmin())
    expect(result.current).toBe(true)
    act(() => useAuthStore.getState().setRole("member"))
    expect(result.current).toBe(false)
  })
})
