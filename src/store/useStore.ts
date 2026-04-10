import { create } from "zustand"
import type { CuitSearchResponse, PathResponse } from "@/types"

type Theme = "light" | "dark"

/** Active application tab identifier. */
export type TabId = "search" | "path" | "add" | "edit" | "base"


interface ThemeSlice {
  theme: Theme
  /** Toggles between light and dark theme. */
  toggleTheme: () => void
}

interface CuitSearchSlice {
  cuitResult: CuitSearchResponse | null
  cuitLoading: boolean
  cuitError: string | null
  setCuitResult: (result: CuitSearchResponse | null) => void
  setCuitLoading: (loading: boolean) => void
  setCuitError: (error: string | null) => void
}

interface PathSearchSlice {
  pathResult: PathResponse | null
  pathLoading: boolean
  pathError: string | null
  setPathResult: (result: PathResponse | null) => void
  setPathLoading: (loading: boolean) => void
  setPathError: (error: string | null) => void
}

interface NavigationSlice {
  activeTab: TabId
  /** Sets the active tab. */
  setActiveTab: (tab: TabId) => void
  /**
   * Tax ID pre-loaded into the Edit Node tab.
   * Set this before navigating to "edit" to auto-search on mount.
   */
  editTaxId: string | null
  setEditTaxId: (taxId: string | null) => void
}

/** Combined application state. */
type AppState = ThemeSlice & CuitSearchSlice & PathSearchSlice & NavigationSlice


export const useStore = create<AppState>((set) => ({
  // Theme
  theme: "dark",
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),

  cuitResult: null,
  cuitLoading: false,
  cuitError: null,
  setCuitResult: (result) => set({ cuitResult: result }),
  setCuitLoading: (loading) => set({ cuitLoading: loading }),
  setCuitError: (error) => set({ cuitError: error }),

  pathResult: null,
  pathLoading: false,
  pathError: null,
  setPathResult: (result) => set({ pathResult: result }),
  setPathLoading: (loading) => set({ pathLoading: loading }),
  setPathError: (error) => set({ pathError: error }),

  activeTab: "search",
  setActiveTab: (tab) => set({ activeTab: tab }),
  editTaxId: null,
  setEditTaxId: (taxId) => set({ editTaxId: taxId }),
}))