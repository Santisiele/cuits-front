import { create } from "zustand"

type Theme = "light" | "dark"

export type TabId = "search" | "path" | "add" | "edit" | "base" | "companies" | "to-know"

export const TAB_ROUTES: Record<TabId, string> = {
  search:    "/search",
  path:      "/path",
  add:       "/add",
  edit:      "/edit",
  base:      "/base",
  companies: "/companies",
  "to-know": "/to-know",
}

export const ROUTE_TABS: Record<string, TabId> = Object.fromEntries(
  Object.entries(TAB_ROUTES).map(([tab, route]) => [route, tab as TabId])
)

type SortDir = "asc" | "desc"

/**
 * Per-table UI state persisted across navigation.
 * `selectedSources` is stored as string[] for serialisability;
 * components convert to Set locally for O(1) lookups.
 */
interface TableState {
  search: string
  sortField: string
  sortDir: SortDir
  selectedSources: string[]
}

interface AppState {
  theme: Theme
  toggleTheme: () => void
  editTaxId: string | null
  setEditTaxId: (taxId: string | null) => void
  nodeTable: TableState
  setNodeTable: (state: Partial<TableState>) => void
  companyTable: TableState
  setCompanyTable: (state: Partial<TableState>) => void
  /**
   * "Por conocer" table state — mirrors nodeTable exactly, since the
   * two views share the same filter surface and export behaviour.
   */
  toKnowTable: TableState
  setToKnowTable: (state: Partial<TableState>) => void
}

export const useStore = create<AppState>((set) => ({
  theme: "dark",
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
  editTaxId: null,
  setEditTaxId: (taxId) => set({ editTaxId: taxId }),
  nodeTable: { search: "", sortField: "businessName", sortDir: "asc", selectedSources: [] },
  setNodeTable: (s) => set((state) => ({ nodeTable: { ...state.nodeTable, ...s } })),
  companyTable: { search: "", sortField: "relationshipCount", sortDir: "desc", selectedSources: [] },
  setCompanyTable: (s) => set((state) => ({ companyTable: { ...state.companyTable, ...s } })),
  toKnowTable: { search: "", sortField: "businessName", sortDir: "asc", selectedSources: [] },
  setToKnowTable: (s) => set((state) => ({ toKnowTable: { ...state.toKnowTable, ...s } })),
}))