export type Role = "creator" | "admin" | "member"

export const ROLE_LABELS: Record<Role, string> = {
  creator: "Creador",
  admin: "Admin",
  member: "Común",
}

export function toRole(value: unknown): Role | null {
  return value === "creator" || value === "admin" || value === "member" ? value : null
}

export function isAdminRole(role: Role | null | undefined): boolean {
  return role === "creator" || role === "admin"
}

export function isCreatorRole(role: Role | null | undefined): boolean {
  return role === "creator"
}
