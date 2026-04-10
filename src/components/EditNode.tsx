import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GraphView } from "@/components/GraphView"
import { GraphService } from "@/services/api"
import { useStore } from "@/store/useStore"
import { getErrorMessage } from "@/lib/errors"
import type { NodeData, CuitSearchResponse } from "@/types"

// ─── Types ───────────────────────────────────────────────────────────────────

type SearchStatus = "idle" | "loading" | "found" | "not_found" | "error"
type SaveStatus = "idle" | "loading" | "success" | "error"

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Tab panel that lets the user search for a node by CUIT,
 * view and edit its contact fields, and visualise its relationships.
 *
 * Can be pre-populated by setting `editTaxId` in the global store
 * before navigating to the "edit" tab (e.g. from the node table).
 */
export function EditNode() {
  const { editTaxId, setEditTaxId } = useStore()

  const [taxId, setTaxId] = useState("")
  const [maxDepth, setMaxDepth] = useState("1")
  const [node, setNode] = useState<NodeData | null>(null)
  const [graphResult, setGraphResult] = useState<CuitSearchResponse | null>(null)
  const [searchStatus, setSearchStatus] = useState<SearchStatus>("idle")
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")

  // Editable contact fields — kept separate from `node` so partial edits
  // don't mutate the canonical node data before saving.
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [birthday, setBirthday] = useState("")

  /** Fetches node data and its graph relationships by Tax ID. */
  const fetchNode = useCallback(async (id: string): Promise<void> => {
    setSearchStatus("loading")
    setNode(null)
    setGraphResult(null)
    setSaveStatus("idle")

    try {
      const result = await GraphService.getNode(id)
      setNode(result)
      setPhone(result.phone ?? "")
      setEmail(result.email ?? "")
      setBirthday(result.birthday ?? "")
      setSearchStatus("found")

      // Graph relationships are optional — not finding them is not an error.
      try {
        const graph = await GraphService.getNodeRelationships(id, 1)
        setGraphResult(graph)
      } catch {
        // Silently ignore — graph view is supplementary
      }
    } catch (error) {
      const message = getErrorMessage(error)
      setSearchStatus(message.includes("not found") ? "not_found" : "error")
    }
  }, [])

  // Auto-search when the store pre-loads a Tax ID (e.g. from NodeTable).
  useEffect(() => {
    if (!editTaxId) return
    setTaxId(editTaxId)
    setMaxDepth("1")
    setEditTaxId(null)
    void fetchNode(editTaxId)
  }, [editTaxId, setEditTaxId, fetchNode])

  async function handleSearch(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    const trimmed = taxId.trim()
    if (!trimmed) return
    await fetchNode(trimmed)
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    if (!node) return

    setSaveStatus("loading")
    try {
      await GraphService.updateNode(node.taxId, {
        phone: phone || undefined,
        email: email || undefined,
        birthday: birthday || undefined,
      })
      setSaveStatus("success")
    } catch {
      setSaveStatus("error")
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">

      {/* Search form */}
      <Card className="shrink-0">
        <CardHeader>
          <CardTitle>Buscar nodo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={taxId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaxId(e.target.value)}
              placeholder="CUIT"
              disabled={searchStatus === "loading"}
            />
            <Input
              value={maxDepth}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxDepth(e.target.value)}
              placeholder="Profundidad"
              type="number"
              min={1}
              max={10}
              className="w-28"
              disabled={searchStatus === "loading"}
            />
            <Button
              type="submit"
              disabled={searchStatus === "loading" || !taxId.trim()}
            >
              {searchStatus === "loading" ? "Buscando..." : "Buscar"}
            </Button>
          </form>

          {searchStatus === "not_found" && (
            <p className="text-destructive text-sm mt-2">CUIT no encontrado en el grafo</p>
          )}
          {searchStatus === "error" && (
            <p className="text-destructive text-sm mt-2">Error al buscar el nodo</p>
          )}
        </CardContent>
      </Card>

      {/* Node detail + edit form */}
      {node && (
        <Card className="shrink-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{node.businessName ?? node.taxId}</CardTitle>
              <div className="flex gap-2">
                <Badge variant={node.inMyBase ? "default" : "secondary"}>
                  {node.inMyBase ? "En mi base" : "Externo"}
                </Badge>
                {node.source && <Badge variant="outline">{node.source}</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-4">
                <span>CUIT</span>
                <span className="font-mono">{node.taxId}</span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Teléfono</label>
                <Input
                  value={phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                  placeholder="Sin teléfono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="Sin email"
                  type="email"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha de nacimiento</label>
                <Input
                  value={birthday}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBirthday(e.target.value)}
                  placeholder="DD/MM/AAAA"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={saveStatus === "loading"}>
                  {saveStatus === "loading" ? "Guardando..." : "Guardar"}
                </Button>
                {saveStatus === "success" && (
                  <Badge variant="default">Guardado exitosamente</Badge>
                )}
                {saveStatus === "error" && (
                  <Badge variant="destructive">Error al guardar</Badge>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Relationship graph */}
      {graphResult && (
        <Card className="flex flex-col flex-1 min-h-0">
          <CardHeader className="shrink-0">
            <CardTitle>Relaciones</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 min-h-0">
            <GraphView nodeResult={graphResult} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}