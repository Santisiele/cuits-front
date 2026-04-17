import { create } from "zustand"

// ─── Types ───────────────────────────────────────────────────────────────────

type Theme = "light" | "dark"

export type TabId = "search" | "path" | "add" | "edit" | "base" | "companies"

export const TAB_ROUTES: Record<TabId, string> = {
  search:    "/search",
  path:      "/path",
  add:       "/add",
  edit:      "/edit",
  base:      "/base",
  companies: "/companies",
}

export const ROUTE_TABS: Record<string, TabId> = Object.fromEntries(
  Object.entries(TAB_ROUTES).map(([tab, route]) => [route, tab as TabId])
)

// ─── Store ───────────────────────────────────────────────────────────────────

type SortDir = "asc" | "desc"

interface TableState {
  search: string
  sortField: string
  sortDir: SortDir
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
}

export const useStore = create<AppState>((set) => ({
  theme: "dark",
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
  editTaxId: null,
  setEditTaxId: (taxId) => set({ editTaxId: taxId }),
  nodeTable: { search: "", sortField: "businessName", sortDir: "asc" },
  setNodeTable: (s) => set((state) => ({ nodeTable: { ...state.nodeTable, ...s } })),
  companyTable: { search: "", sortField: "relationshipCount", sortDir: "desc" },
  setCompanyTable: (s) => set((state) => ({ companyTable: { ...state.companyTable, ...s } })),
}))