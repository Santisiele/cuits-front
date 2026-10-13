import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRecentResearch, useResearchBudget, useUpdateResearchLimit } from "@/hooks/useResearch"
import { formatIsoDateTime } from "@/lib/dates"
import { getErrorMessage } from "@/lib/errors"
import { formatUsd, limitError, parseLimit, spentShare } from "@/lib/research"
import { cn } from "@/lib/utils"

function LimitForm({ current }: { current: number }) {
  const update = useUpdateResearchLimit()
  const [value, setValue] = useState(String(current))
  const [error, setError] = useState("")

  const problem = limitError(value)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    const limit = parseLimit(value)
    if (limit === null) return
    setError("")
    try {
      await update.mutateAsync(limit)
      toast.success("Se guardó el tope")
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2">
      <label className="text-sm font-medium" htmlFor="monthly-limit">Tope mensual (US$)</label>
      <div className="flex gap-2">
        <Input
          id="monthly-limit"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full sm:w-40"
        />
        <Button type="submit" disabled={!!problem || update.isPending}>
          {update.isPending ? "Guardando..." : "Guardar tope"}
        </Button>
      </div>
      {problem && <p className="text-destructive text-sm">{problem}</p>}
      {error && <p className="text-destructive text-sm">{error}</p>}
    </form>
  )
}

export function AiCreditsScreen() {
  const budget = useResearchBudget()
  const recent = useRecentResearch()
  const research = recent.data ?? []
  const share = budget.data ? spentShare(budget.data.spentThisMonthUsd, budget.data.monthlyLimitUsd) : 0

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Créditos IA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {budget.isLoading ? (
            <p className="text-muted-foreground text-sm">Cargando...</p>
          ) : budget.error || !budget.data ? (
            <p className="text-destructive text-sm">{getErrorMessage(budget.error, "Error al cargar el gasto")}</p>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-sm">
                  Gastado este mes: <span className="font-medium">{formatUsd(budget.data.spentThisMonthUsd)}</span> de{" "}
                  {formatUsd(budget.data.monthlyLimitUsd)}
                </p>
                <div
                  className="h-3 w-full bg-muted"
                  role="progressbar"
                  aria-label="Gastado del tope"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(share * 100)}
                >
                  <div
                    className={cn("h-full", share >= 1 ? "bg-destructive" : "bg-primary")}
                    style={{ width: `${share * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {budget.data.researchCountThisMonth}{" "}
                  {budget.data.researchCountThisMonth === 1 ? "búsqueda" : "búsquedas"} este mes
                </p>
              </div>
              <LimitForm key={budget.data.monthlyLimitUsd} current={budget.data.monthlyLimitUsd} />
            </>
          )}
          <p className="text-xs text-muted-foreground">
            El tope de la app no reemplaza el límite configurado en la consola de Anthropic
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Últimas investigaciones</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {recent.isLoading ? (
            <p className="text-muted-foreground text-sm">Cargando...</p>
          ) : recent.error ? (
            <p className="text-destructive text-sm">{getErrorMessage(recent.error)}</p>
          ) : research.length === 0 ? (
            <p className="text-muted-foreground text-sm">Todavía no hay investigaciones.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-1.5 pr-3 font-medium">CUIT</th>
                  <th className="text-left py-1.5 px-3 font-medium">Nombre</th>
                  <th className="text-left py-1.5 px-3 font-medium">Pidió</th>
                  <th className="text-left py-1.5 px-3 font-medium">Fecha</th>
                  <th className="text-right py-1.5 pl-3 font-medium">Costo</th>
                </tr>
              </thead>
              <tbody>
                {research.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="py-1.5 pr-3 font-mono">{item.taxId}</td>
                    <td className="py-1.5 px-3">
                      {item.businessName}
                      {item.status === "failed" && (
                        <Badge variant="destructive" className="ml-2">Falló</Badge>
                      )}
                    </td>
                    <td className="py-1.5 px-3">{item.requestedBy}</td>
                    <td className="py-1.5 px-3 whitespace-nowrap">{formatIsoDateTime(item.requestedAt)}</td>
                    <td className="py-1.5 pl-3 text-right tabular-nums whitespace-nowrap">{formatUsd(item.costUsd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
