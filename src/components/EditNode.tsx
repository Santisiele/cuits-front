import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GraphView } from "@/components/GraphView"
import { useStore } from "@/store/useStore"
import { useNode, useNodeRelationships, useUpdateNode } from "@/hooks/useGraphQueries"

// ─── Types ───────────────────────────────────────────────────────────────────

type SearchStatus = "idle" | "found" | "not_found" | "error"

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Tab panel that lets the user search for a node by CUIT,
 * view and edit its contact fields, and visualise its relationships.
 *
 * Uses React Query hooks for caching — repeated lookups of the same
 * CUIT won't re-fetch within the configured TTL.
 */
export function EditNode() {
  const { editTaxId, setEditTaxId } = useStore()

  const [taxId, setTaxId] = useState("")
  const [maxDepth] = useState(1)
  const [searchedId, setSearchedId] = useState("")
  const [searchStatus, setSearchStatus] = useState<SearchStatus>("idle")

  // Editable contact fields
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [birthday, setBirthday] = useState("")

  // React Query hooks — only fetch when searchedId is set
  const nodeQuery = useNode(searchedId, !!searchedId)
  const relationshipsQuery = useNodeRelationships(searchedId, maxDepth, !!searchedId)
  const updateMutation = useUpdateNode(searchedId)

  // Sync form fields when node data loads
  useEffect(() => {
    if (nodeQuery.data) {
      setPhone(nodeQuery.data.phone ?? "")
      setEmail(nodeQuery.data.email ?? "")
      setBirthday(nodeQuery.data.birthday ?? "")
      setSearchStatus("found")
    } else if (nodeQuery.isError) {
      const message = (nodeQuery.error as Error).message
      setSearchStatus(message.includes("not found") ? "not_found" : "error")
    }
  }, [nodeQuery.data, nodeQuery.isError, nodeQuery.error])

  // Auto-search when navigating from NodeTable
  useEffect(() => {
    if (!editTaxId) return
    setTaxId(editTaxId)
    setSearchedId(editTaxId)
    setEditTaxId(null)
    setSearchStatus("idle")
  }, [editTaxId, setEditTaxId])

  function handleSearch(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault()
    const trimmed = taxId.trim()
    if (!trimmed) return
    setSearchStatus("idle")
    setSearchedId(trimmed)
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    if (!nodeQuery.data) return
    await updateMutation.mutateAsync({
      phone: phone || undefined,
      email: email || undefined,
      birthday: birthday || undefined,
    })
  }

  const node = nodeQuery.data
  const graphResult = relationshipsQuery.data ?? null
  const isSearching = nodeQuery.isFetching

  return (
    <div className="flex flex-col gap-4">

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
              disabled={isSearching}
            />
            <Button type="submit" disabled={isSearching || !taxId.trim()}>
              {isSearching ? "Buscando..." : "Buscar"}
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
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Guardando..." : "Guardar"}
                </Button>
                {updateMutation.isSuccess && (
                  <Badge variant="default">Guardado exitosamente</Badge>
                )}
                {updateMutation.isError && (
                  <Badge variant="destructive">Error al guardar</Badge>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Relationship graph */}
      {graphResult && (
        <Card className="shrink-0">
          <CardHeader>
            <CardTitle>Relaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: "50vh", minHeight: "300px" }}>
              <GraphView nodeResult={graphResult} nodeRootName={node?.businessName ?? undefined} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}