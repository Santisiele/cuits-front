import type { ReactElement } from "react"
import { Navigate } from "react-router-dom"
import { useAuthStore } from "@/store/useAuthStore"
import { isAdminRole } from "@/lib/roles"

export function AdminRoute({ children }: { children: ReactElement }) {
  const token = useAuthStore((state) => state.token)
  const role = useAuthStore((state) => state.role)

  if (token && role === null) return null
  if (!isAdminRole(role)) return <Navigate to="/" replace />
  return children
}
