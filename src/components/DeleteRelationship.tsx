import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { RELATIONSHIP_OPTIONS } from "../utils/relationshipLabels"
import { deleteRelationship } from "../services/api"

interface DeleteRelationshipProps {
  onSuccess?: () => void
}

type Status = "idle" | "loading" | "success" | "error" | "not_found"

/**
 * Form to delete a relationship between two Tax IDs
 */
export function DeleteRelationship({ onSuccess }: DeleteRelationshipProps) {
  const [fromTaxId, setFromTaxId] = useState("")
  const [toTaxId, setToTaxId] = useState("")
  const [relationshipType, setRelationshipType] = useState<number>(8)
  const [status, setStatus] = useState<Status>("idle")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!fromTaxId.trim() || !toTaxId.trim()) return

    setStatus("loading")

    try {
      await deleteRelationship(fromTaxId.trim(), toTaxId.trim(), relationshipType)
      setStatus("success")
      setFromTaxId("")
      setToTaxId("")
      onSuccess?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : ""
      if (message.includes("not found")) setStatus("not_found")
      else setStatus("error")
    }
  }

  const statusMessages: Record<Status, { text: string; variant: "default" | "destructive" | "secondary" } | null> = {
    idle: null,
    loading: null,
    success: { text: "Relación eliminada exitosamente", variant: "default" },
    error: { text: "Error al eliminar la relación", variant: "destructive" },
    not_found: { text: "La relación no existe entre los dos CUITs", variant: "destructive" },
  }

  const statusMessage = statusMessages[status]

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Eliminar relación</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={fromTaxId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromTaxId(e.target.value)}
              placeholder="CUIT origen"
              disabled={status === "loading"}
            />
            <Input
              value={toTaxId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToTaxId(e.target.value)}
              placeholder="CUIT destino"
              disabled={status === "loading"}
            />
          </div>

          <select
            value={relationshipType}
            onChange={(e) => setRelationshipType(Number(e.target.value))}
            disabled={status === "loading"}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {Object.entries(RELATIONSHIP_OPTIONS).map(([code, name]) => (
              <option key={code} value={Number(code)}>
                {name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              variant="destructive"
              disabled={status === "loading" || !fromTaxId.trim() || !toTaxId.trim() || fromTaxId === toTaxId}
            >
              {status === "loading" ? "Eliminando..." : "Eliminar relación"}
            </Button>
            {statusMessage && (
              <Badge variant={statusMessage.variant}>
                {statusMessage.text}
              </Badge>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}