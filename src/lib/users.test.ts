import { describe, it, expect } from "vitest"
import {
  CREATABLE_ROLES,
  PASSWORD_ERROR,
  USERNAME_ERROR,
  allowedUserActions,
  hasAnyAction,
  passwordError,
  usernameError,
} from "@/lib/users"

describe("usernameError", () => {
  it("accepts letters, digits, dots, dashes and underscores", () => {
    expect(usernameError("ana.perez_2-b")).toBeNull()
  })

  it("accepts 3 and 32 characters", () => {
    expect(usernameError("ana")).toBeNull()
    expect(usernameError("a".repeat(32))).toBeNull()
  })

  it("rejects 2 and 33 characters", () => {
    expect(usernameError("an")).toBe(USERNAME_ERROR)
    expect(usernameError("a".repeat(33))).toBe(USERNAME_ERROR)
  })

  it("rejects spaces and accents inside", () => {
    expect(usernameError("ana perez")).toBe(USERNAME_ERROR)
    expect(usernameError("josé")).toBe(USERNAME_ERROR)
  })

  it("ignores surrounding spaces like the API", () => {
    expect(usernameError("  ana  ")).toBeNull()
  })
})

describe("passwordError", () => {
  it("accepts 8 and 72 characters", () => {
    expect(passwordError("12345678")).toBeNull()
    expect(passwordError("a".repeat(72))).toBeNull()
  })

  it("rejects 7 and 73 characters", () => {
    expect(passwordError("1234567")).toBe(PASSWORD_ERROR)
    expect(passwordError("a".repeat(73))).toBe(PASSWORD_ERROR)
  })

  it("counts bytes for the upper limit like the API", () => {
    expect(passwordError("ñ".repeat(36))).toBeNull()
    expect(passwordError("ñ".repeat(37))).toBe(PASSWORD_ERROR)
  })
})

describe("CREATABLE_ROLES", () => {
  it("never offers the creator", () => {
    expect(CREATABLE_ROLES).toEqual(["member", "admin"])
  })
})

describe("allowedUserActions", () => {
  const none = { makeAdmin: false, makeMember: false, toggleDisabled: false, resetPassword: false }
  const onMember = { makeAdmin: true, makeMember: false, toggleDisabled: true, resetPassword: true }
  const onAdmin = { makeAdmin: false, makeMember: true, toggleDisabled: true, resetPassword: true }

  it("lets nobody touch the creator", () => {
    expect(allowedUserActions("creator", "creator")).toEqual(none)
    expect(allowedUserActions("admin", "creator")).toEqual(none)
  })

  it("lets the creator manage a member", () => {
    expect(allowedUserActions("creator", "member")).toEqual(onMember)
  })

  it("lets an admin manage a member", () => {
    expect(allowedUserActions("admin", "member")).toEqual(onMember)
  })

  it("lets the creator manage an admin", () => {
    expect(allowedUserActions("creator", "admin")).toEqual(onAdmin)
  })

  it("lets an admin do nothing to an admin", () => {
    expect(allowedUserActions("admin", "admin")).toEqual(none)
  })

  it("lets a member or no one do nothing", () => {
    expect(allowedUserActions("member", "member")).toEqual(none)
    expect(allowedUserActions(null, "member")).toEqual(none)
  })
})

describe("hasAnyAction", () => {
  it("is false when nothing is allowed", () => {
    expect(hasAnyAction(allowedUserActions("admin", "admin"))).toBe(false)
  })

  it("is true when something is allowed", () => {
    expect(hasAnyAction(allowedUserActions("admin", "member"))).toBe(true)
    expect(hasAnyAction({ makeAdmin: false, makeMember: false, toggleDisabled: false, resetPassword: true })).toBe(true)
  })
})
