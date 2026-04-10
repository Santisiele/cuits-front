import "./App.css"
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
import { GraphService } from "@/services/api"
import { getErrorMessage, translateApiError } from "@/lib/errors"

/**
 * Root application component.
 *
 * Owns the top-level search handlers and delegates rendering
 * to tab-specific child components.
 */
export default function App() {
  const {
    theme,
    toggleTheme,
    cuitResult,
    cuitLoading,
    cuitError,
    setCuitResult,
    setCuitLoading,
    setCuitError,
    pathResult,
    pathLoading,
    pathError,
    setPathResult,
    setPathLoading,
    setPathError,
    activeTab,
    setActiveTab,
  } = useStore()

  /** Searches for a CUIT and stores the result (or error) in the global store. */
  async function handleCuitSearch(taxId: string, maxDepth: number): Promise<void> {
    setCuitLoading(true)
    setCuitError(null)
    setCuitResult(null)
    try {
      const result = await GraphService.searchCuit(taxId, maxDepth)
      setCuitResult(result)
    } catch (error) {
      setCuitError(translateApiError(getErrorMessage(error)))
    } finally {
      setCuitLoading(false)
    }
  }

  /** Finds the shortest path between two CUITs and stores the result in the global store. */
  async function handlePathSearch(from: string, to: string, maxDepth: number): Promise<void> {
    setPathLoading(true)
    setPathError(null)
    setPathResult(null)
    try {
      const result = await GraphService.findPath(from, to, maxDepth)
      setPathResult(result)
    } catch (error) {
      setPathError(translateApiError(getErrorMessage(error)))
    } finally {
      setPathLoading(false)
    }
  }

  return (
    <div className={`${theme} h-screen flex flex-col bg-background overflow-hidden`}>
      <div className="flex flex-col flex-1 min-h-0 bg-background text-foreground p-3 sm:p-6">

        {/* Header */}
        <header className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold truncate">Buscador de CUIT</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Buscar y explorar relaciones entre CUITs</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {theme === "dark" ? "Dark" : "Light"}
            </span>
            <Switch checked={theme === "light"} onCheckedChange={toggleTheme} />
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
              {cuitError && (
                <p className="text-destructive text-sm">{cuitError}</p>
              )}
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
              {pathError && (
                <p className="text-destructive text-sm">{pathError}</p>
              )}
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
    </div>
  )
}