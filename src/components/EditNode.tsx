import { useState, useEffect, useCallback } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { GraphView } from "./GraphView"
import type { CuitSearchResponse } from "../types"
import { getNode, updateNode, getNodeRelationships } from "../services/api"
import { useStore } from "../store/useStore"

interface NodeData {
  taxId: string
  businessName: string | null
  phone: string | null
  email: string | null
  birthday: string | null
  inMyBase: boolean
  source: string | null
}

type SearchStatus = "idle" | "loading" | "found" | "not_found" | "error"
type SaveStatus = "idle" | "loading" | "success" | "error"

/**
 * Component to search, edit a node's fields and visualize its relationships
 */
export function EditNode() {
  const { editTaxId, setEditTaxId } = useStore()

  const [taxId, setTaxId] = useState("")
  const [node, setNode] = useState<NodeData | null>(null)
  const [searchStatus, setSearchStatus] = useState<SearchStatus>("idle")
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const [graphResult, setGraphResult] = useState<CuitSearchResponse | null>(null)
  const [maxDepth, setMaxDepth] = useState("1")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [birthday, setBirthday] = useState("")

  const handleSearchById = useCallback(async (id: string) => {
    setSearchStatus("loading")
    setNode(null)
    setGraphResult(null)
    setSaveStatus("idle")

    try {
      const result = await getNode(id) as unknown as NodeData
      setNode(result)
      setPhone(result.phone ?? "")
      setEmail(result.email ?? "")
      setBirthday(result.birthday ?? "")
      setSearchStatus("found")

      try {
        const graph = await getNodeRelationships(id, 1)
        setGraphResult(graph)
      } catch {
        // graph not found is ok
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : ""
      setSearchStatus(message.includes("not found") ? "not_found" : "error")
    }
  }, [])

  useEffect(() => {
    if (editTaxId) {
      setTaxId(editTaxId)
      setMaxDepth("1")
      setEditTaxId(null)
      void handleSearchById(editTaxId)
    }
  }, [editTaxId, setEditTaxId, handleSearchById])

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!taxId.trim()) return
    await handleSearchById(taxId.trim())
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!node) return

    setSaveStatus("loading")

    try {
      await updateNode(node.taxId, {
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
    <div className="space-y-4">
      <Card>
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
            <Button type="submit" disabled={searchStatus === "loading" || !taxId.trim()}>
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

      {node && (
        <Card>
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
                {saveStatus === "success" && <Badge variant="default">Guardado exitosamente</Badge>}
                {saveStatus === "error" && <Badge variant="destructive">Error al guardar</Badge>}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {graphResult && (
        <Card>
          <CardHeader>
            <CardTitle>Relaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <GraphView nodeResult={graphResult} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}