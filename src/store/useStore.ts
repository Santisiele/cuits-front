import { create } from "zustand"
import type { CuitSearchResponse, PathResponse } from "../types"

type Theme = "light" | "dark"

interface AppState {
  theme: Theme
  toggleTheme: () => void

  cuitResult: CuitSearchResponse | null
  cuitLoading: boolean
  cuitError: string | null
  setCuitResult: (result: CuitSearchResponse | null) => void
  setCuitLoading: (loading: boolean) => void
  setCuitError: (error: string | null) => void

  pathResult: PathResponse | null
  pathLoading: boolean
  pathError: string | null
  setPathResult: (result: PathResponse | null) => void
  setPathLoading: (loading: boolean) => void
  setPathError: (error: string | null) => void
}

export const useStore = create<AppState>((set) => ({
  theme: "dark",
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),

  // CUIT search
  cuitResult: null,
  cuitLoading: false,
  cuitError: null,
  setCuitResult: (result) => set({ cuitResult: result }),
  setCuitLoading: (loading) => set({ cuitLoading: loading }),
  setCuitError: (error) => set({ cuitError: error }),

  // Path search
  pathResult: null,
  pathLoading: false,
  pathError: null,
  setPathResult: (result) => set({ pathResult: result }),
  setPathLoading: (loading) => set({ pathLoading: loading }),
  setPathError: (error) => set({ pathError: error }),
}))