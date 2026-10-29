import { describe, it, expect } from "vitest"
import { keepOpenWhileDirty } from "@/lib/dialogGuard"

describe("keepOpenWhileDirty", () => {
  it("keeps the dialog open on an outside click or Escape only while something was typed", () => {
    const dirty = new Event("close", { cancelable: true })
    keepOpenWhileDirty(true).onInteractOutside(dirty)
    expect(dirty.defaultPrevented).toBe(true)
    const clean = new Event("close", { cancelable: true })
    keepOpenWhileDirty(false).onEscapeKeyDown(clean)
    expect(clean.defaultPrevented).toBe(false)
  })
})
