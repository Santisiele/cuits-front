import "./App.css"
import { Routes, Route, NavLink, Navigate, useNavigate } from "react-router-dom"
import { Switch } from "@/components/ui/switch"
import { SearchBar } from "@/components/SearchBar"
import { PathSearchBar } from "@/components/PathSearchBar"
import { GraphView } from "@/components/GraphView"
import { AddRelationship } from "@/components/AddRelationship"
import { DeleteRelationship } from "@/components/DeleteRelationship"
import { EditNode } from "@/components/EditNode"
import { NodeTable } from "@/components/NodeTable"
import { CompanyTable } from "@/components/CompanyTable"
import { useStore } from "@/store/useStore"
import { AuthApiService } from "@/services/api"
import { LoginModal } from "@/components/LoginModal"
import { useAuthStore } from "@/store/useAuthStore"
import { Button } from "@/components/ui/button"
import { useCuitSearch, usePathSearch } from "@/hooks/useGraphQueries"
import { useState } from "react"
import type { CuitSearchResponse, PathResponse } from "@/types"

// ─── Nav link styles ─────────────────────────────────────────────────────────

const navClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs sm:text-sm font-medium transition-all ${
    isActive
      ? "bg-background text-foreground shadow"
      : "text-muted-foreground hover:text-foreground"
  }`

// ─── Search tab (keeps its own state so it persists across navigation) ────────

function SearchTab() {
  const [cuitInput, setCuitInput] = useState({ taxId: "", maxDepth: 3, enabled: false })
  const cuitQuery = useCuitSearch(cuitInput.taxId, cuitInput.maxDepth, cuitInput.enabled)

  function handleSearch(taxId: string, maxDepth: number): void {
    setCuitInput({ taxId, maxDepth, enabled: true })
  }

  const result = cuitQuery.data as CuitSearchResponse | undefined
  const error = cuitQuery.error ? (cuitQuery.error as Error).message : null

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <div className="shrink-0 space-y-2">
        <SearchBar title="Buscar un CUIT" onSearch={handleSearch} loading={cuitQuery.isFetching} />
        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>
      {result ? <GraphView cuitResult={result} /> : <div className="flex-1" />}
    </div>
  )
}

// ─── Path tab ────────────────────────────────────────────────────────────────

function PathTab() {
  const [pathInput, setPathInput] = useState({ from: "", to: "", maxDepth: 3, enabled: false })
  const pathQuery = usePathSearch(pathInput.from, pathInput.to, pathInput.maxDepth, pathInput.enabled)

  function handleSearch(from: string, to: string, maxDepth: number): void {
    setPathInput({ from, to, maxDepth, enabled: true })
  }

  const result = pathQuery.data as PathResponse | undefined
  const error = pathQuery.error ? (pathQuery.error as Error).message : null

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <div className="shrink-0 space-y-2">
        <PathSearchBar onSearch={handleSearch} loading={pathQuery.isFetching} />
        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>
      {result ? <GraphView pathResult={result} /> : <div className="flex-1" />}
    </div>
  )
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [loginOpen, setLoginOpen] = useState(false)
  const { isAuthenticated, username } = useAuthStore()
  const { theme, toggleTheme } = useStore()
  const navigate = useNavigate()

  function handleNodeNavigate(taxId: string): void {
    useStore.getState().setEditTaxId(taxId)
    void navigate("/edit")
  }

  return (
    <div className={`${theme} h-screen flex flex-col bg-background overflow-hidden`}>
      <div className="flex flex-col flex-1 min-h-0 bg-background text-foreground p-3 sm:p-6">

        {/* Header */}
        <header className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
          <div className="min-w-0">
            <h1 className="text-base sm:text-3xl font-bold leading-tight">Buscador de CUIT</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Buscar y explorar relaciones entre CUITs</p>
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

        {/* Nav */}
        <div className="overflow-x-auto pb-1 mb-2 shrink-0">
          <div className="flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-full">
            <NavLink to="/search"    className={navClass}>Buscar CUIT</NavLink>
            <NavLink to="/path"      className={navClass}>Buscar relación</NavLink>
            <NavLink to="/add"       className={navClass}>Manejar relación</NavLink>
            <NavLink to="/edit"      className={navClass}>Editar persona</NavLink>
            <NavLink to="/base"      className={navClass}>Mi base</NavLink>
            <NavLink to="/companies" className={navClass}>Empresas a buscar</NavLink>
          </div>
        </div>

        {/* Routes */}
        <div className="flex flex-col flex-1 min-h-0">
          <Routes>
            <Route path="/" element={<Navigate to="/search" replace />} />
            <Route path="/search"    element={<SearchTab />} />
            <Route path="/path"      element={<PathTab />} />
            <Route path="/add"       element={
              <div className="overflow-y-auto flex-1 space-y-4">
                <AddRelationship />
                <DeleteRelationship />
              </div>
            } />
            <Route path="/edit"      element={
              <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
                <EditNode onNodeNavigate={handleNodeNavigate} />
              </div>
            } />
            <Route path="/base"      element={
              <div className="flex-1 overflow-y-auto">
                <NodeTable />
              </div>
            } />
            <Route path="/companies" element={
              <div className="flex-1 overflow-y-auto">
                <CompanyTable />
              </div>
            } />
          </Routes>
        </div>

      </div>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} theme={theme} />
    </div>
  )
}