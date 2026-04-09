import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { RELATIONSHIP_OPTIONS } from "../utils/relationshipLabels"
import { addRelationship } from "../services/api"

interface AddRelationshipProps {
  onSuccess?: () => void
}

type Status = "idle" | "loading" | "success" | "error" | "duplicate" | "not_found"

/**
 * Form to manually add a relationship between two Tax IDs
 */
export function AddRelationship({ onSuccess }: AddRelationshipProps) {
  const [fromTaxId, setFromTaxId] = useState("")
  const [toTaxId, setToTaxId] = useState("")
  const [relationshipType, setRelationshipType] = useState<number>(8)
  const [status, setStatus] = useState<Status>("idle")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!fromTaxId.trim() || !toTaxId.trim()) return

    setStatus("loading")

    try {
      await addRelationship(fromTaxId.trim(), toTaxId.trim(), relationshipType)
      setStatus("success")
      setFromTaxId("")
      setToTaxId("")
      onSuccess?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : ""
      if (message.includes("already exists")) setStatus("duplicate")
      else if (message.includes("not found")) setStatus("not_found")
      else setStatus("error")
    }
  }

  const statusMessages: Record<Status, { text: string; variant: "default" | "destructive" | "secondary" } | null> = {
    idle: null,
    loading: null,
    success: { text: "Relación creada exitosamente", variant: "default" },
    error: { text: "Error al crear la relación", variant: "destructive" },
    duplicate: { text: "Esta relación ya existe entre los dos CUITs", variant: "destructive" },
    not_found: { text: "Uno o ambos CUITs no existen en el grafo", variant: "destructive" },
  }

  const statusMessage = statusMessages[status]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agregar relación manual</CardTitle>
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
              disabled={status === "loading" || !fromTaxId.trim() || !toTaxId.trim() || fromTaxId === toTaxId}
            >
              {status === "loading" ? "Guardando..." : "Agregar relación"}
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