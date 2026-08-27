import { create } from "zustand"

type Theme = "light" | "dark"

export type TabId =
  | "search"
  | "path"
  | "add"
  | "edit"
  | "base"
  | "companies"
  | "to-know"
  | "full-base"
  | "crossing-over"
  | "sources"

export const TAB_ROUTES: Record<TabId, string> = {
  search:          "/search",
  path:            "/path",
  add:             "/add",
  edit:            "/edit",
  base:            "/base",
  companies:       "/companies",
  "to-know":       "/to-know",
  "full-base":     "/full-base",
  "crossing-over": "/crossing-over",
  sources:         "/sources",
}

export const ROUTE_TABS: Record<string, TabId> = Object.fromEntries(
  Object.entries(TAB_ROUTES).map(([tab, route]) => [route, tab as TabId])
)

type SortDir = "asc" | "desc"

/**
 * Per-table UI state persisted across navigation.
 *
 * `selectedSources` semantics vary per table:
 *   - `nodeTable` / `toKnowTable`: OR-union — any match shows the node
 *   - `companyTable`: OR-union on relatedSources
 *   - `fullBaseTable`: single-choice (0 or 1 entries)
 *   - `crossingOverTable`: AND-intersection — all selected sources must be
 *     present in the node's sources
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
  toKnowTable: TableState
  setToKnowTable: (state: Partial<TableState>) => void
  fullBaseTable: TableState
  setFullBaseTable: (state: Partial<TableState>) => void
  /**
   * "Crossing over" table state — multi-select AND filter that only
   * renders once at least two sources are selected.
   */
  crossingOverTable: TableState
  setCrossingOverTable: (state: Partial<TableState>) => void
}

export const useStore = create<AppState>((set) => ({
  theme: "dark",
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
  editTaxId: null,
  setEditTaxId: (taxId) => set({ editTaxId: taxId }),
  nodeTable:        { search: "", sortField: "businessName",      sortDir: "asc",  selectedSources: [] },
  setNodeTable:     (s) => set((state) => ({ nodeTable: { ...state.nodeTable, ...s } })),
  companyTable:     { search: "", sortField: "relationshipCount", sortDir: "desc", selectedSources: [] },
  setCompanyTable:  (s) => set((state) => ({ companyTable: { ...state.companyTable, ...s } })),
  toKnowTable:      { search: "", sortField: "businessName",      sortDir: "asc",  selectedSources: [] },
  setToKnowTable:   (s) => set((state) => ({ toKnowTable: { ...state.toKnowTable, ...s } })),
  fullBaseTable:    { search: "", sortField: "businessName",      sortDir: "asc",  selectedSources: [] },
  setFullBaseTable: (s) => set((state) => ({ fullBaseTable: { ...state.fullBaseTable, ...s } })),
  crossingOverTable: { search: "", sortField: "businessName",      sortDir: "asc",  selectedSources: [] },
  setCrossingOverTable: (s) => set((state) => ({ crossingOverTable: { ...state.crossingOverTable, ...s } })),
}))