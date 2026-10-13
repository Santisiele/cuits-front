import { describe, it, expect } from "vitest"
import { ROLE_LABELS, isAdminRole, toRole } from "@/lib/roles"

describe("toRole", () => {
  it("accepts the three roles", () => {
    expect(toRole("creator")).toBe("creator")
    expect(toRole("admin")).toBe("admin")
    expect(toRole("member")).toBe("member")
  })

  it("rejects anything else", () => {
    expect(toRole("owner")).toBeNull()
    expect(toRole(undefined)).toBeNull()
  })
})

describe("isAdminRole", () => {
  it("treats the creator as an admin", () => {
    expect(isAdminRole("creator")).toBe(true)
  })

  it("is true for an admin", () => {
    expect(isAdminRole("admin")).toBe(true)
  })

  it("is false for a member or no role", () => {
    expect(isAdminRole("member")).toBe(false)
    expect(isAdminRole(null)).toBe(false)
    expect(isAdminRole(undefined)).toBe(false)
  })
})

describe("ROLE_LABELS", () => {
  it("names each role in Spanish", () => {
    expect(ROLE_LABELS).toEqual({ creator: "Creador", admin: "Admin", member: "Común" })
  })
})
