import { create } from "zustand"
import { persist } from "zustand/middleware"
import { queryClient } from "@/lib/queryClient"

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
    (set, get) => ({
      token: null,
      username: null,
      isAuthenticated: false,

      setAuth: (token, username) => {
        set({ token, username, isAuthenticated: true })
        // Refetch every query that had failed (typically with 401 because
        // the user wasn't authenticated yet). This makes the page the user
        // is currently viewing populate automatically right after login,
        // without forcing them to navigate away and come back.
        void queryClient.refetchQueries({
          type: "active",
          predicate: (query) => query.state.status === "error",
        })
      },

      clearAuth: () => {
        /**
         * Every 401 reaches this, and clearing the cache makes each mounted
         * query refetch — which 401s again on an expired token. Without this
         * guard the two feed each other and the app hammers the API in a
         * tight loop for as long as the screen stays open. Clearing once is
         * enough; later calls have nothing left to clear.
         */
        if (!get().token && !get().isAuthenticated) return

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