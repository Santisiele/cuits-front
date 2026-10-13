import { useEffect } from "react"
import { AuthApiService } from "@/services/api"
import { useAuthStore } from "@/store/useAuthStore"
import { isAdminRole, toRole } from "@/lib/roles"

export function useSessionRole(): void {
  const token = useAuthStore((state) => state.token)

  useEffect(() => {
    if (!token) return
    AuthApiService.me()
      .then((me) => {
        if (useAuthStore.getState().token === token) useAuthStore.getState().setRole(toRole(me.role))
      })
      .catch(() => undefined)
  }, [token])
}

export function useIsAdmin(): boolean {
  return useAuthStore((state) => isAdminRole(state.role))
}
