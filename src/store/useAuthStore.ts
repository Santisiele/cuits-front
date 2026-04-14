import { create } from "zustand"
import { persist } from "zustand/middleware"
import { queryClient } from "@/providers/QueryProvider"

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthState {
  token: string | null
  username: string | null
  isAuthenticated: boolean
  /** Sets the token and username after a successful login. */
  setAuth: (token: string, username: string) => void
  /**
   * Clears the token and username on logout.
   * Also clears the entire React Query cache so stale data
   * from the previous session is not shown to a new user.
   */
  clearAuth: () => void
}

// ─── Store ────────────────────────────────────────────────────────────────────

/**
 * Auth store persisted to localStorage so the user stays logged in
 * across page refreshes until the JWT expires.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      username: null,
      isAuthenticated: false,

      setAuth: (token, username) =>
        set({ token, username, isAuthenticated: true }),

      clearAuth: () => {
        // Clear all cached queries so the next user starts fresh
        queryClient.clear()
        set({ token: null, username: null, isAuthenticated: false })
      },
    }),
    {
      name: "cuit-auth",
      partialize: (state) => ({
        token: state.token,
        username: state.username,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)