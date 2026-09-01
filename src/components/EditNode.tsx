import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GraphView } from "@/components/GraphView"
import { useStore } from "@/store/useStore"
import { useNode, useNodeRelationships, useUpdateNode, queryKeys } from "@/hooks/useGraphQueries"
import { EditNodeSourcesDialog } from "@/components/node-sources/EditNodeSourcesDialog"
import { formatActivityMonth } from "@/lib/activityMonths"

// ─── Types ───────────────────────────────────────────────────────────────────

type SearchStatus = "idle" | "found" | "not_found" | "error"

interface FormFields {
  phone: string
  email: string
  birthday: string
  entryDate: string
  exitDate: string
  loadedAt: string
}

const EMPTY_FIELDS: FormFields = {
  phone: "",
  email: "",
  birthday: "",
  entryDate: "",
  exitDate: "",
  loadedAt: "",
}

// ─── Date conversion helpers ─────────────────────────────────────────────────

/**
 * Converts a date string in dd/mm/yyyy format into the yyyy-mm-dd format
 * required by HTML `<input type="date">`. Returns "" when the input is
 * empty or malformed, which makes the input render as blank.
 */
function toIsoDate(ddmmyyyy: string): string {
  const match = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(ddmmyyyy.trim())
  if (!match) return ""
  const [, d, m, y] = match
  return `${y}-${m!.padStart(2, "0")}-${d!.padStart(2, "0")}`
}

/**
 * Converts a yyyy-mm-dd date string (emitted by HTML date inputs) back
 * into the dd/mm/yyyy format the backend persists. Returns "" when the
 * input is empty, so clearing the field saves a blank value.
 */
function fromIsoDate(yyyymmdd: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(yyyymmdd.trim())
  if (!match) return ""
  const [, y, m, d] = match
  return `${d}/${m}/${y}`
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Tab panel that lets the user search for a node by CUIT, view and edit
 * its contact fields, and visualise its relationships.
 *
 * Layout: the wrapper is a plain vertical stack with no flex sizing. Each
 * card sizes to its content, and the GraphView at the bottom shows the full
 * tree without internal scroll. If the whole page doesn't fit on screen,
 * the route container (in App.tsx) scrolls the page.
 *
 * Form hydration:
 *  - When the React Query result arrives for a new taxId, we adopt the
 *    server values via the "setState during render with key comparison"
 *    pattern (React's recommended alternative to useEffect for
 *    prop-derived state).
 *
 * Auto-search from NodeTable:
 *  - We subscribe to the Zustand store and react to changes in `editTaxId`
 *    by kicking off the search here. The store entry is cleared in a
 *    microtask to avoid updating another component's state during render.
 */
export function EditNode() {
  const editTaxId = useStore((s) => s.editTaxId)
  const setEditTaxId = useStore((s) => s.setEditTaxId)
  const queryClient = useQueryClient()

  const [taxId, setTaxId] = useState("")
  const maxDepth = 1
  const [searchedId, setSearchedId] = useState("")

  /** taxId for which the form has been hydrated. */
  const [hydratedFor, setHydratedFor] = useState<string>("")
  /** In-progress form edits. Hydrated from server data, mutated by the user. */
  const [fields, setFields] = useState<FormFields>(EMPTY_FIELDS)

  // ── Adopt the editTaxId pushed from NodeTable ──────────────────────────
  if (editTaxId && editTaxId !== searchedId) {
    setTaxId(editTaxId)
    setHydratedFor("")
    setFields(EMPTY_FIELDS)
    void queryClient.invalidateQueries({ queryKey: queryKeys.node(editTaxId) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.nodeRelationships(editTaxId, maxDepth) })
    setSearchedId(editTaxId)
    queueMicrotask(() => setEditTaxId(null))
  }

  // React Query hooks — only fetch when searchedId is set
  const nodeQuery = useNode(searchedId, !!searchedId)
  const relationshipsQuery = useNodeRelationships(searchedId, maxDepth, !!searchedId)
  const updateMutation = useUpdateNode(searchedId)

  // ── Derived values (computed during render) ────────────────────────────
  const node = nodeQuery.data
  const graphResult = relationshipsQuery.data ?? null
  const isSearching = nodeQuery.isFetching
  const sources = node?.sources ?? []
  const [sourcesDialogOpen, setSourcesDialogOpen] = useState(false)

  const searchStatus: SearchStatus = (() => {
    if (!searchedId) return "idle"
    if (nodeQuery.isError) {
      const message = (nodeQuery.error as Error).message
      return message.includes("not found") ? "not_found" : "error"
    }
    if (node) return "found"
    return "idle"
  })()

  // ── Hydrate the form once per (newly fetched) node ─────────────────────
  if (node && node.taxId !== hydratedFor) {
    setHydratedFor(node.taxId)
    setFields({
      phone:     node.phone     ?? "",
      email:     node.email     ?? "",
      birthday:  node.birthday  ?? "",
      entryDate: (node as { entryDate?: string | null }).entryDate ?? "",
      exitDate:  (node as { exitDate?: string | null }).exitDate ?? "",
      loadedAt:  (node as { loadedAt?: string | null }).loadedAt ?? "",
    })
  }

  function triggerSearch(id: string): void {
    setHydratedFor("")
    setFields(EMPTY_FIELDS)
    void queryClient.invalidateQueries({ queryKey: queryKeys.node(id) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.nodeRelationships(id, maxDepth) })
    setSearchedId(id)
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault()
    const trimmed = taxId.trim()
    if (!trimmed) return
    triggerSearch(trimmed)
  }

  function updateField<K extends keyof FormFields>(key: K, value: string): void {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  /**
   * Handler for date-input changes. The native picker emits yyyy-mm-dd,
   * which we translate back into the dd/mm/yyyy format the backend uses.
   */
  function updateDateField<K extends keyof FormFields>(key: K, isoValue: string): void {
    setFields((prev) => ({ ...prev, [key]: fromIsoDate(isoValue) }))
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    if (!node) return
    await updateMutation.mutateAsync({
      phone:     fields.phone     || undefined,
      email:     fields.email     || undefined,
      birthday:  fields.birthday  || undefined,
      entryDate: fields.entryDate || undefined,
      exitDate:  fields.exitDate  || undefined,
      loadedAt:  fields.loadedAt  || undefined,
    })
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Search form */}
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
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{node.businessName ?? node.taxId}</CardTitle>
              <div className="flex gap-2">
                <Badge variant={node.inMyBase ? "default" : "secondary"}>
                  {node.inMyBase ? "En mi base" : "Externo"}
                </Badge>
                {sources.map((s: string) => (
                  <Badge key={s} variant="outline">{s}</Badge>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-4">
                <span>CUIT</span>
                <span className="font-mono">{node.taxId}</span>
              </div>

              {/* Only sources that record dated operations produce these, so
                  the block stays out of the way for everyone else. */}
              {(node.activityMonths?.length ?? 0) > 0 && (
                <div className="space-y-2 mb-4">
                  <span className="text-sm text-muted-foreground">
                    Meses con operaciones
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {node.activityMonths?.map((month) => (
                      <Badge key={month} variant="outline">
                        {formatActivityMonth(month)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Teléfono</label>
                <Input
                  value={fields.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("phone", e.target.value)}
                  placeholder="Sin teléfono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={fields.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("email", e.target.value)}
                  placeholder="Sin email"
                  type="email"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha de nacimiento</label>
                <Input
                  type="date"
                  value={toIsoDate(fields.birthday)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateDateField("birthday", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha de carga</label>
                <Input
                  type="date"
                  value={toIsoDate(fields.loadedAt)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateDateField("loadedAt", e.target.value)}
                  disabled
                />
              </div>

              {sources.includes("Residentes Senior Home") && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fecha de ingreso</label>
                    <Input
                      type="date"
                      value={toIsoDate(fields.entryDate)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateDateField("entryDate", e.target.value)}
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fecha de egreso</label>
                    <Input
                      type="date"
                      value={toIsoDate(fields.exitDate)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateDateField("exitDate", e.target.value)}
                      disabled={!!fields.exitDate}
                    />
                  </div>
                </>
              )}

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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSourcesDialogOpen(true)}
                >
                  Editar fuentes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Relationship graph — grows with content, no internal scroll. */}
      {graphResult && (
        <Card>
          <CardHeader>
            <CardTitle>Relaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <GraphView nodeResult={graphResult} nodeRootName={node?.businessName ?? undefined} />
          </CardContent>
        </Card>
      )}

      {sourcesDialogOpen && node && (
        <EditNodeSourcesDialog node={node} onClose={() => setSourcesDialogOpen(false)} />
      )}
    </div>
  )
}