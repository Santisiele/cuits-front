import type { ReactElement } from "react"
import { Navigate } from "react-router-dom"
import { useAuthStore } from "@/store/useAuthStore"
import { isCreatorRole } from "@/lib/roles"

export function CreatorRoute({ children }: { children: ReactElement }) {
  const token = useAuthStore((state) => state.token)
  const role = useAuthStore((state) => state.role)

  if (token && role === null) return null
  if (!isCreatorRole(role)) return <Navigate to="/" replace />
  return children
}
