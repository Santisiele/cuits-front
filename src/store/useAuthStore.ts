import { create } from "zustand"
import { persist } from "zustand/middleware"

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthState {
  token: string | null
  username: string | null
  /** Sets the token and username after a successful login. */
  setAuth: (token: string, username: string) => void
  /** Clears the token and username on logout. */
  clearAuth: () => void
  /** Returns true if the user has a token (may still be expired). */
  isAuthenticated: boolean
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

      clearAuth: () =>
        set({ token: null, username: null, isAuthenticated: false }),
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