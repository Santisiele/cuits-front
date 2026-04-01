import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { Switch } from "./components/ui/switch"
import { SearchBar } from "./components/SearchBar"
import { PathSearchBar } from "./components/PathSearchBar"
import { GraphView } from "./components/GraphView"
import { useStore } from "./store/useStore"
import { searchCuit, findPath } from "./services/api"
import { AddRelationship } from "./components/AddRelationship"
import { DeleteRelationship } from "./components/DeleteRelationship"

/**
 * Main application component
 */
export default function App() {
  const {
    theme, toggleTheme,
    cuitResult, cuitLoading, cuitError,
    setCuitResult, setCuitLoading, setCuitError,
    pathResult, pathLoading, pathError,
    setPathResult, setPathLoading, setPathError,
  } = useStore()

  const [activeTab, setActiveTab] = useState("search")

  async function handleCuitSearch(taxId: string, maxDepth: number) {
    setCuitLoading(true)
    setCuitError(null)
    setCuitResult(null)
    try {
      const result = await searchCuit(taxId, maxDepth)
      setCuitResult(result)
    } catch (error) {
      setCuitError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setCuitLoading(false)
    }
  }

  async function handlePathSearch(from: string, to: string, maxDepth: number) {
    setPathLoading(true)
    setPathError(null)
    setPathResult(null)
    try {
      const result = await findPath(from, to, maxDepth)
      setPathResult(result)
    } catch (error) {
      setPathError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setPathLoading(false)
    }
  }

  return (
    <div className={theme}>
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Buscador de CUIT</h1>
              <p className="text-muted-foreground">Buscar y explorar relaciones entre CUITs</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {theme === "dark" ? "Dark" : "Light"}
              </span>
              <Switch
                checked={theme === "light"}
                onCheckedChange={toggleTheme}
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="search">Buscar CUIT</TabsTrigger>
              <TabsTrigger value="path">Buscar relacion</TabsTrigger>
              <TabsTrigger value="add">Manejar relación</TabsTrigger>
            </TabsList>

            {/* Search Tab */}
            <TabsContent value="search" className="space-y-4">
              <SearchBar
                title="Search for a Tax ID"
                onSearch={handleCuitSearch}
                loading={cuitLoading}
              />
              {cuitError && (
                <p className="text-destructive text-sm">
                  {cuitError === "Tax ID not found in graph"
                    ? "CUIT no encontrado en el grafo"
                    : cuitError}
                </p>
              )}
              {cuitResult && (
                <GraphView cuitResult={cuitResult} />
              )}
            </TabsContent>

            {/* Path Tab */}
            <TabsContent value="path" className="space-y-4">
              <PathSearchBar
                onSearch={handlePathSearch}
                loading={pathLoading}
              />
              {pathError && (
                <p className="text-destructive text-sm">
                  {pathError === "No path found between the two Tax IDs"
                    ? "No se encontró ningún camino entre los dos CUITs"
                    : pathError === "From and To Tax IDs must be different"
                      ? "Los dos CUITs deben ser distintos"
                      : pathError}
                </p>
              )}
              {pathResult && (
                <GraphView pathResult={pathResult} />
              )}
            </TabsContent>

            <TabsContent value="add" className="space-y-4">
              <AddRelationship />
              <DeleteRelationship />
            </TabsContent>

          </Tabs>

        </div>
      </div>
    </div>
  )
}