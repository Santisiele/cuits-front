import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useNosisPending } from "@/hooks/useCrm"
import { formatIsoDate } from "@/lib/dates"
import { getErrorMessage } from "@/lib/errors"
import { formatTaxId } from "@/lib/cuit"

export function NosisPendingScreen() {
  const queue = useNosisPending()
  const items = queue.data?.items ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pendientes de Nosis ({items.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {queue.data && (
          <p className="text-sm">
            Para buscarlos: <code className="bg-muted px-1.5 py-0.5 font-mono text-xs">{queue.data.command} [cantidad]</code>
          </p>
        )}
        {queue.isLoading ? (
          <p className="text-muted-foreground text-sm">Cargando...</p>
        ) : queue.error ? (
          <p className="text-destructive text-sm">{getErrorMessage(queue.error, "Error al cargar los pendientes")}</p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground text-sm">No hay CUITs pendientes de Nosis.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-1.5 pr-3 font-medium">CUIT</th>
                  <th className="text-left py-1.5 px-3 font-medium">Nombre</th>
                  <th className="text-left py-1.5 px-3 font-medium">Fuentes</th>
                  <th className="text-left py-1.5 pl-3 font-medium">Cargado</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.taxId} className="border-b border-border last:border-0">
                    <td className="py-1.5 pr-3 font-mono whitespace-nowrap">{formatTaxId(item.taxId)}</td>
                    <td className="py-1.5 px-3">{item.businessName || "—"}</td>
                    <td className="py-1.5 px-3">{item.sources.join(", ") || "—"}</td>
                    <td className="py-1.5 pl-3 whitespace-nowrap">
                      {[item.addedBy, item.addedAt && formatIsoDate(item.addedAt)].filter(Boolean).join(" · ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
