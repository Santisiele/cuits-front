import "./App.css"
import { Routes, Route, Navigate } from "react-router-dom"
import { Switch } from "@/components/ui/switch"
import { SearchBar } from "@/components/SearchBar"
import { PathSearchBar } from "@/components/PathSearchBar"
import { GraphView } from "@/components/GraphView"
import { AddRelationship } from "@/components/AddRelationship"
import { DeleteRelationship } from "@/components/DeleteRelationship"
import { EditNode } from "@/components/EditNode"
import { NodeTable } from "@/components/NodeTable"
import { CompanyTable } from "@/components/CompanyTable"
import { CrossingOverTable } from "@/components/CrossingOverTable"
import { ToKnowTable } from "@/components/ToKnowTable"
import { BirthdaysTable } from "@/components/BirthdaysTable"
import { FullBaseTable } from "./components/FullBaseTable"
import { SourcesTable } from "@/components/SourcesTable"
import { Toaster } from "@/components/ui/sonner"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { useStore } from "@/store/useStore"
import { AuthApiService } from "@/services/api"
import { LoginModal } from "@/components/LoginModal"
import { useAuthStore } from "@/store/useAuthStore"
import { Button } from "@/components/ui/button"
import { useCuitSearch, usePathSearch } from "@/hooks/useGraphQueries"
import { useState, useEffect } from "react"
import type { CuitSearchResponse, PathResponse } from "@/types"

// ─── Search tab ──────────────────────────────────────────────────────────────

/**
 * Search tab — looks up a single CUIT and shows its tree.
 * Plain vertical stack: form + (optional) GraphView, both grow with content.
 */
function SearchTab() {
  const [cuitInput, setCuitInput] = useState({ taxId: "", maxDepth: 3, enabled: false })
  const cuitQuery = useCuitSearch(cuitInput.taxId, cuitInput.maxDepth, cuitInput.enabled)

  function handleSearch(taxId: string, maxDepth: number): void {
    setCuitInput({ taxId, maxDepth, enabled: true })
  }

  const result = cuitQuery.data as CuitSearchResponse | undefined
  const error = cuitQuery.error ? (cuitQuery.error as Error).message : null

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <SearchBar title="Buscar un CUIT" onSearch={handleSearch} loading={cuitQuery.isFetching} />
        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>
      {result && <GraphView cuitResult={result} />}
    </div>
  )
}

// ─── Path tab ────────────────────────────────────────────────────────────────

/**
 * Path tab — finds the shortest path between two CUITs and shows it.
 * Same layout as SearchTab.
 */
function PathTab() {
  const [pathInput, setPathInput] = useState({ from: "", to: "", maxDepth: 3, enabled: false })
  const pathQuery = usePathSearch(pathInput.from, pathInput.to, pathInput.maxDepth, pathInput.enabled)

  function handleSearch(from: string, to: string, maxDepth: number): void {
    setPathInput({ from, to, maxDepth, enabled: true })
  }

  const result = pathQuery.data as PathResponse | undefined
  const error = pathQuery.error ? (pathQuery.error as Error).message : null

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <PathSearchBar onSearch={handleSearch} loading={pathQuery.isFetching} />
        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>
      {result && <GraphView pathResult={result} />}
    </div>
  )
}

// ─── App ─────────────────────────────────────────────────────────────────────

/**
 * Page layout:
 *  - The outermost `div` is the full viewport (h-screen + overflow-hidden)
 *  - Header + nav don't shrink (shrink-0)
 *  - The routes container has overflow-y-auto so the PAGE scrolls when its
 *    content (forms + GraphView + tables) is taller than the viewport
 *  - Each route is plain content — no internal flex sizing — so the
 *    container's overflow is what handles overflow
 */
export default function App() {
  const [loginOpen, setLoginOpen] = useState(false)
  const { isAuthenticated, username } = useAuthStore()
  const { theme, toggleTheme } = useStore()

  /**
   * The theme class has to live on <html>, not on a wrapper div.
   *
   * Radix renders dialogs, the navigation drawer and the toaster through a
   * portal into document.body, outside the React tree. The dark variant is
   * defined as `&:is(.dark *)`, so anything portalled out of a themed wrapper
   * falls back to the light palette — which is why the modals used to open
   * white while the app behind them was dark.
   */
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)
  }, [theme])

  return (
    <div className={`${theme} h-screen flex flex-col bg-background overflow-hidden`}>
      <div className="flex flex-col flex-1 min-h-0 bg-background text-foreground p-3 sm:p-6">

        {/* Header */}
        <header className="flex items-center justify-between mb-4 sm:mb-6 gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <AppSidebar />
            <div className="min-w-0">
              <h1 className="text-base sm:text-3xl font-bold leading-tight">Buscador de CUIT</h1>
              <p className="text-muted-foreground text-xs sm:text-sm hidden sm:block">Buscar y explorar relaciones entre CUITs</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {theme === "dark" ? "Dark" : "Light"}
            </span>
            <Switch checked={theme === "light"} onCheckedChange={toggleTheme} />
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">{username}</span>
                <Button variant="outline" size="sm" onClick={() => void AuthApiService.logout()}>Salir</Button>
              </div>
            ) : (
              <Button size="sm" onClick={() => setLoginOpen(true)}>Iniciar sesión</Button>
            )}
          </div>
        </header>


        {/* Routes — flex-1 so this takes the remaining height, overflow-y-auto
            so the PAGE scrolls when content overflows the viewport. */}
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/search" replace />} />
            <Route path="/search"    element={<SearchTab />} />
            <Route path="/path"      element={<PathTab />} />
            <Route path="/add"       element={
              <div className="space-y-4">
                <AddRelationship />
                <DeleteRelationship />
              </div>
            } />
            <Route path="/edit"      element={<EditNode />} />
            <Route path="/base"      element={<NodeTable />} />
            <Route path="/companies" element={<CompanyTable />} />
            <Route path="/to-know"   element={<ToKnowTable />} />
            <Route path="/birthdays" element={<BirthdaysTable />} />
            <Route path="/full-base"  element={<FullBaseTable />} />
            <Route path="/crossing-over"  element={<CrossingOverTable />} />
            <Route path="/sources"        element={<SourcesTable />} />
          </Routes>
        </div>

      </div>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} theme={theme} />
      <Toaster />
    </div>
  )
}