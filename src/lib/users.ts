import { isAdminRole, type Role } from "@/lib/roles"

export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 72

const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,32}$/

export const USERNAME_ERROR =
  "El usuario tiene que tener entre 3 y 32 letras, números, puntos, guiones o guiones bajos"
export const PASSWORD_ERROR = "La contraseña tiene que tener entre 8 y 72 caracteres"

export type CreatableRole = "member" | "admin"

export const CREATABLE_ROLES: CreatableRole[] = ["member", "admin"]

export function usernameError(username: string): string | null {
  return USERNAME_PATTERN.test(username.trim()) ? null : USERNAME_ERROR
}

export function passwordError(password: string): string | null {
  const bytes = new TextEncoder().encode(password).length
  return password.length >= MIN_PASSWORD_LENGTH && bytes <= MAX_PASSWORD_LENGTH ? null : PASSWORD_ERROR
}

export interface UserActions {
  makeAdmin: boolean
  makeMember: boolean
  toggleDisabled: boolean
  resetPassword: boolean
}

const NO_ACTIONS: UserActions = { makeAdmin: false, makeMember: false, toggleDisabled: false, resetPassword: false }

export function allowedUserActions(actor: Role | null, target: Role): UserActions {
  if (!isAdminRole(actor)) return NO_ACTIONS
  if (target === "member") return { makeAdmin: true, makeMember: false, toggleDisabled: true, resetPassword: true }
  if (target === "admin" && actor === "creator") {
    return { makeAdmin: false, makeMember: true, toggleDisabled: true, resetPassword: true }
  }
  return NO_ACTIONS
}

export function hasAnyAction(actions: UserActions): boolean {
  return actions.makeAdmin || actions.makeMember || actions.toggleDisabled || actions.resetPassword
}
