import { Fragment, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ResearchDetails } from "@/components/research/ResearchDetails"
import { useArchivedResearch, useRestoreResearch } from "@/hooks/useResearch"
import { useStore } from "@/store/useStore"
import { formatIsoDateTime } from "@/lib/dates"
import { getErrorMessage } from "@/lib/errors"
import { archivedText, formatUsd } from "@/lib/research"

const LINK = "cursor-pointer text-left hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
const HEAD = "text-left py-2 px-3 text-muted-foreground font-medium"
const COLUMNS = 8

export function ArchivedResearchScreen() {
  const archived = useArchivedResearch()
  const restore = useRestoreResearch()
  const { setEditTaxId } = useStore()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [error, setError] = useState("")
  const research = archived.data ?? []

  function openNode(taxId: string): void {
    setEditTaxId(taxId)
    void navigate("/edit")
  }

  async function handleRestore(id: string): Promise<void> {
    setError("")
    try {
      await restore.mutateAsync(id)
      toast.success("Búsqueda restaurada")
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Búsquedas archivadas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 overflow-x-auto">
        {error && <p className="text-destructive text-sm">{error}</p>}
        {archived.isLoading ? (
          <p className="text-muted-foreground text-sm">Cargando...</p>
        ) : archived.error ? (
          <p className="text-destructive text-sm">{getErrorMessage(archived.error)}</p>
        ) : research.length === 0 ? (
          <p className="text-muted-foreground text-sm">No hay búsquedas archivadas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className={HEAD}>
                  <span className="sr-only">Resumen</span>
                </th>
                <th className={HEAD}>Nombre</th>
                <th className={HEAD}>CUIT</th>
                <th className={HEAD}>Fecha</th>
                <th className={HEAD}>Pedida por</th>
                <th className={HEAD}>Archivada</th>
                <th className={`${HEAD} text-right`}>Costo</th>
                <th className={HEAD}>
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {research.map((item) => {
                const open = expanded === item.id
                const restoring = restore.isPending && restore.variables === item.id
                return (
                  <Fragment key={item.id}>
                    <tr className="border-b border-border last:border-0">
                      <td className="py-2 px-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={open ? "Ocultar resumen" : "Ver resumen"}
                          aria-expanded={open}
                          onClick={() => setExpanded(open ? null : item.id)}
                        >
                          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                      </td>
                      <td className="py-2 px-3">
                        <button type="button" onClick={() => openNode(item.taxId)} className={LINK}>
                          {item.businessName || "—"}
                        </button>
                        {item.status === "failed" && (
                          <Badge variant="destructive" className="ml-2">Falló</Badge>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono text-xs">{item.taxId}</td>
                      <td className="py-2 px-3 whitespace-nowrap">{formatIsoDateTime(item.requestedAt)}</td>
                      <td className="py-2 px-3">{item.requestedBy}</td>
                      <td className="py-2 px-3 whitespace-nowrap">{archivedText(item.archivedBy, item.archivedAt)}</td>
                      <td className="py-2 px-3 text-right tabular-nums whitespace-nowrap">{formatUsd(item.costUsd)}</td>
                      <td className="py-2 px-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void handleRestore(item.id)}
                          disabled={restore.isPending}
                        >
                          {restoring ? "Restaurando..." : "Restaurar"}
                        </Button>
                      </td>
                    </tr>
                    {open && (
                      <tr className="border-b border-border last:border-0">
                        <td colSpan={COLUMNS} className="py-3 px-3 space-y-2" data-testid={`archived-${item.id}`}>
                          <ResearchDetails research={item} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}
