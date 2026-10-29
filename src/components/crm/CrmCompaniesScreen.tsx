import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCrmCompanies } from "@/hooks/useCrm"
import { getErrorMessage } from "@/lib/errors"
import { formatDay, originLabel } from "@/lib/crm"
import { formatTaxId } from "@/lib/cuit"
import { AddCompanyDialog } from "./AddCompanyDialog"

export function CrmCompaniesScreen() {
  const companies = useCrmCompanies()
  const navigate = useNavigate()
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<"open" | "closed" | "all">("open")

  const needle = search.trim().toLowerCase()
  const all = companies.data ?? []
  const closedCount = all.filter((company) => company.closedAt !== null).length
  const rows = all.filter(
    (company) =>
      (status === "all" || (status === "closed") === (company.closedAt !== null)) &&
      (needle === "" || company.businessName.toLowerCase().includes(needle) || company.taxId.includes(needle.replace(/\D/g, "") || needle))
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
          <CardTitle>Empresas del CRM ({companies.data?.length ?? 0})</CardTitle>
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Agregar empresa
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o CUIT" className="sm:max-w-xs" />
          <div className="flex" role="group" aria-label="Estado">
            {(["open", "closed", "all"] as const).map((option) => (
              <Button
                key={option}
                size="sm"
                variant={status === option ? "default" : "outline"}
                aria-pressed={status === option}
                onClick={() => setStatus(option)}
                className="-ml-px first:ml-0"
              >
                {option === "open" ? `Activas (${all.length - closedCount})` : option === "closed" ? `Cerradas (${closedCount})` : "Todas"}
              </Button>
            ))}
          </div>
        </div>
        {companies.isLoading ? (
          <p className="text-muted-foreground text-sm">Cargando...</p>
        ) : companies.error ? (
          <p className="text-destructive text-sm">{getErrorMessage(companies.error, "Error al cargar las empresas")}</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">{needle ? "Ninguna empresa coincide." : "Todavía no hay empresas en el CRM."}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-1.5 pr-3 font-medium">Empresa</th>
                  <th className="text-left py-1.5 px-3 font-medium hidden md:table-cell">Marca</th>
                  <th className="text-left py-1.5 px-3 font-medium hidden md:table-cell">Producto</th>
                  <th className="text-left py-1.5 px-3 font-medium hidden lg:table-cell">Origen</th>
                  <th className="text-left py-1.5 px-3 font-medium">Última acción</th>
                  <th className="text-left py-1.5 px-3 font-medium">Próximo vencimiento</th>
                  <th className="text-right py-1.5 pl-3 font-medium">Tareas</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((company) => (
                  <tr
                    key={company.taxId}
                    onClick={() => void navigate(`/crm/${company.taxId}`)}
                    className="border-b border-border last:border-0 cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <td className="py-1.5 pr-3">
                      <div className="font-medium">{company.businessName || "—"}</div>
                      <div className="text-xs text-muted-foreground font-mono">{formatTaxId(company.taxId)}</div>
                      <div className="flex gap-1 flex-wrap">
                        {company.closedAt && <Badge variant="destructive" className="mt-1">Cerrada</Badge>}
                        {company.nosisPending && <Badge variant="secondary" className="mt-1">Pendiente de Nosis</Badge>}
                      </div>
                    </td>
                    <td className="py-1.5 px-3 hidden md:table-cell">{company.crmBrand ?? "—"}</td>
                    <td className="py-1.5 px-3 hidden md:table-cell">{company.crmProduct ?? "—"}</td>
                    <td className="py-1.5 px-3 hidden lg:table-cell">{originLabel(company)}</td>
                    <td className="py-1.5 px-3 whitespace-nowrap">{formatDay(company.lastActionDate)}</td>
                    <td className="py-1.5 px-3 whitespace-nowrap">{formatDay(company.nextDueDate)}</td>
                    <td className="py-1.5 pl-3 text-right tabular-nums">{company.openTaskCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
      {adding && <AddCompanyDialog onClose={() => setAdding(false)} />}
    </Card>
  )
}
