import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { useTrustLevelsQuery } from "@/hooks/useTrustLevels"
import { TrustLevelDialog } from "@/components/trust-levels/TrustLevelDialog"
import { DeleteTrustLevelDialog } from "@/components/trust-levels/DeleteTrustLevelDialog"
import { NO_LEVEL_LABEL, paletteFor } from "@/lib/trustLevels"
import { cn } from "@/lib/utils"
import type { TrustLevelInfo } from "@/types"

export function TrustLevelsTable() {
  const { data: levels = [], isLoading, error } = useTrustLevelsQuery()
  const [editing, setEditing] = useState<TrustLevelInfo | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<TrustLevelInfo | null>(null)

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
          <div className="space-y-1">
            <CardTitle>Niveles de confianza ({levels.length})</CardTitle>
            <p className="text-xs text-muted-foreground">
              Un CUIT sin nivel asignado queda como "{NO_LEVEL_LABEL}" y no lleva etiqueta.
            </p>
          </div>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Nuevo nivel
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 overflow-auto">
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Cargando...</p>
        ) : error ? (
          <p className="text-destructive text-sm">Error al cargar los niveles</p>
        ) : levels.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Todavía no hay niveles. Creá el primero con "Nuevo nivel".
          </p>
        ) : (
          <div className="divide-y divide-border">
            {levels.map((level) => (
              <div
                key={level.value}
                className="flex flex-col sm:flex-row sm:items-start gap-2 justify-between py-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-3">
                    <span className={cn("h-4 w-4 shrink-0", paletteFor(level.color).swatch)} />
                    <Badge
                      variant="outline"
                      className={cn("border-transparent", paletteFor(level.color).badge)}
                    >
                      {level.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {level.nodeCount} {level.nodeCount === 1 ? "CUIT" : "CUITs"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-7">
                    {level.description || "Sin descripción"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(level)}>
                    <Pencil className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDeleting(level)}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Borrar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <TrustLevelDialog open={creating} onClose={() => setCreating(false)} level={null} />
      {editing && (
        <TrustLevelDialog open onClose={() => setEditing(null)} level={editing} />
      )}
      {deleting && (
        <DeleteTrustLevelDialog open onClose={() => setDeleting(null)} level={deleting} />
      )}
    </Card>
  )
}
