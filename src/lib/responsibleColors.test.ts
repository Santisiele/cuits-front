import { describe, it, expect } from "vitest"
import { RESPONSIBLE_COLOR_KEYS, RESPONSIBLE_PALETTE, responsiblePalette } from "@/lib/responsibleColors"

const API_COLORS = [
  "red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal", "violet", "purple", "fuchsia", "pink", "rose", "slate",
  "sky-300", "sky-500", "sky-700", "blue-300", "blue-500", "blue-700", "blue-900", "indigo-300", "indigo-500", "indigo-700",
  "cyan-500", "cyan-700",
]

describe("responsible colors", () => {
  it("offer exactly the colors the API accepts", () => {
    expect([...RESPONSIBLE_COLOR_KEYS].sort()).toEqual([...API_COLORS].sort())
  })

  it("fall back to gray for no color or one it does not know", () => {
    expect(responsiblePalette(null)).toBe(RESPONSIBLE_PALETTE.slate)
    expect(responsiblePalette("magenta")).toBe(RESPONSIBLE_PALETTE.slate)
    expect(responsiblePalette("blue-900")).toBe(RESPONSIBLE_PALETTE["blue-900"])
  })

  it("give every color a distinct name in Spanish", () => {
    const labels = RESPONSIBLE_COLOR_KEYS.map((key) => RESPONSIBLE_PALETTE[key].label)
    expect(new Set(labels).size).toBe(labels.length)
  })
})
