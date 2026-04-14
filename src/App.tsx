import "./App.css"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { SearchBar } from "@/components/SearchBar"
import { PathSearchBar } from "@/components/PathSearchBar"
import { GraphView } from "@/components/GraphView"
import { AddRelationship } from "@/components/AddRelationship"
import { DeleteRelationship } from "@/components/DeleteRelationship"
import { EditNode } from "@/components/EditNode"
import { NodeTable } from "@/components/NodeTable"
import { useStore } from "@/store/useStore"
import type { TabId } from "@/store/useStore"
import { AuthApiService } from "@/services/api"
import { LoginModal } from "@/components/LoginModal"
import { useAuthStore } from "@/store/useAuthStore"
import { Button } from "@/components/ui/button"
import { useCuitSearch, usePathSearch } from "@/hooks/useGraphQueries"
import type { CuitSearchResponse, PathResponse } from "@/types"

/**
 * Root application component.
 *
 * Search state is managed locally with React Query hooks.
 * The global store only holds UI state (theme, active tab, editTaxId).
 */
export default function App() {
  const [loginOpen, setLoginOpen] = useState(false)
  const { isAuthenticated, username } = useAuthStore()

  const { theme, toggleTheme, activeTab, setActiveTab } = useStore()

  // ─── CUIT search state ────────────────────────────────────────────────────
  const [cuitInput, setCuitInput] = useState({ taxId: "", maxDepth: 3, enabled: false })
  const cuitQuery = useCuitSearch(cuitInput.taxId, cuitInput.maxDepth, cuitInput.enabled)

  function handleCuitSearch(taxId: string, maxDepth: number): void {
    setCuitInput({ taxId, maxDepth, enabled: true })
  }

  // ─── Path search state ────────────────────────────────────────────────────
  const [pathInput, setPathInput] = useState({ from: "", to: "", maxDepth: 3, enabled: false })
  const pathQuery = usePathSearch(pathInput.from, pathInput.to, pathInput.maxDepth, pathInput.enabled)

  function handlePathSearch(from: string, to: string, maxDepth: number): void {
    setPathInput({ from, to, maxDepth, enabled: true })
  }

  // ─── Derived values ───────────────────────────────────────────────────────
  const cuitResult = cuitQuery.data as CuitSearchResponse | undefined
  const cuitLoading = cuitQuery.isFetching
  const cuitError = cuitQuery.error ? (cuitQuery.error as Error).message : null

  const pathResult = pathQuery.data as PathResponse | undefined
  const pathLoading = pathQuery.isFetching
  const pathError = pathQuery.error ? (pathQuery.error as Error).message : null

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

        {/* Navigation tabs */}
        <Tabs value={activeTab} onValueChange={(tab) => setActiveTab(tab as TabId)} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-x-auto pb-1 mb-2 shrink-0">
            <TabsList className="w-max min-w-full">
              <TabsTrigger value="search" className="text-xs sm:text-sm">Buscar CUIT</TabsTrigger>
              <TabsTrigger value="path" className="text-xs sm:text-sm">Buscar relación</TabsTrigger>
              <TabsTrigger value="add" className="text-xs sm:text-sm">Manejar relación</TabsTrigger>
              <TabsTrigger value="edit" className="text-xs sm:text-sm">Editar persona</TabsTrigger>
              <TabsTrigger value="base" className="text-xs sm:text-sm">Mi base</TabsTrigger>
            </TabsList>
          </div>

          {/* CUIT search tab */}
          <TabsContent value="search" className="flex flex-col flex-1 min-h-0 gap-4">
            <div className="shrink-0 space-y-2">
              <SearchBar
                title="Buscar un CUIT"
                onSearch={handleCuitSearch}
                loading={cuitLoading}
              />
              {cuitError && <p className="text-destructive text-sm">{cuitError}</p>}
            </div>
            {cuitResult
              ? <GraphView cuitResult={cuitResult} />
              : <div className="flex-1" />
            }
          </TabsContent>

          {/* Path search tab */}
          <TabsContent value="path" className="flex flex-col flex-1 min-h-0 gap-4">
            <div className="shrink-0 space-y-2">
              <PathSearchBar onSearch={handlePathSearch} loading={pathLoading} />
              {pathError && <p className="text-destructive text-sm">{pathError}</p>}
            </div>
            {pathResult
              ? <GraphView pathResult={pathResult} />
              : <div className="flex-1" />
            }
          </TabsContent>

          {/* Relationship management tab */}
          <TabsContent value="add" className="flex-1 overflow-y-auto space-y-4">
            <AddRelationship />
            <DeleteRelationship />
          </TabsContent>

          {/* Node edit tab */}
          <TabsContent value="edit" className="flex flex-col flex-1 min-h-0 overflow-y-auto">
            <EditNode />
          </TabsContent>

          {/* Base nodes table tab */}
          <TabsContent value="base" className="flex-1 overflow-y-auto">
            <NodeTable />
          </TabsContent>
        </Tabs>

      </div>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} theme={theme} />
    </div>
  )
}