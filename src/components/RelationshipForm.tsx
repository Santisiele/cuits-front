import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RELATIONSHIP_OPTIONS } from "@/utils/relationshipLabels"

type Status = "idle" | "loading" | "success" | "error"

interface StatusMessage {
  text: string
  variant: "default" | "destructive" | "secondary"
}

interface RelationshipFormProps {
  /** Card title. */
  title: string
  /** Label for the submit button. */
  submitLabel: string
  /** Label shown on the button while loading. */
  loadingLabel: string
  /** Optional extra CSS classes for the card (e.g. border color). */
  cardClassName?: string
  /** Optional extra CSS classes for the card title. */
  titleClassName?: string
  /** Variant for the submit button. */
  submitVariant?: "default" | "destructive"
  /**
   * Messages shown for each non-idle status.
   * Keys "idle" and "loading" must be `null`.
   */
  statusMessages: Record<Status, StatusMessage | null> & Record<string, StatusMessage | null>
  /**
   * Called when the user submits valid inputs.
   * Should throw with a meaningful `Error.message` on failure.
   */
  onSubmit: (fromTaxId: string, toTaxId: string, relationshipType: number) => Promise<void>
  /** Optional callback invoked after a successful submission. */
  onSuccess?: () => void
}

/**
 * Reusable form for adding or deleting a relationship between two Tax IDs.
 *
 * Owns its own local state (inputs + status) and delegates the actual
 * API call to the parent via {@link RelationshipFormProps.onSubmit}.
 */
export function RelationshipForm({
  title,
  submitLabel,
  loadingLabel,
  cardClassName,
  titleClassName,
  submitVariant = "default",
  statusMessages,
  onSubmit,
  onSuccess,
}: RelationshipFormProps) {
  const [fromTaxId, setFromTaxId] = useState("")
  const [toTaxId, setToTaxId] = useState("")
  const [relationshipType, setRelationshipType] = useState<number>(8)
  const [status, setStatus] = useState<Status>("idle")

  const isDisabled =
    status === "loading" ||
    !fromTaxId.trim() ||
    !toTaxId.trim() ||
    fromTaxId === toTaxId

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    if (isDisabled) return

    setStatus("loading")
    try {
      await onSubmit(fromTaxId.trim(), toTaxId.trim(), relationshipType)
      setStatus("success")
      setFromTaxId("")
      setToTaxId("")
      onSuccess?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : ""
      setStatus(resolveErrorStatus(message))
    }
  }

  const statusMessage = statusMessages[status]

  return (
    <Card className={cardClassName}>
      <CardHeader>
        <CardTitle className={titleClassName}>{title}</CardTitle>
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
            <Button type="submit" variant={submitVariant} disabled={isDisabled}>
              {status === "loading" ? loadingLabel : submitLabel}
            </Button>
            {statusMessage && (
              <Badge variant={statusMessage.variant}>{statusMessage.text}</Badge>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

/**
 * Maps an API error message to one of the known error status values.
 * Falls back to "error" for unrecognised messages.
 */
function resolveErrorStatus(message: string): Exclude<Status, "idle" | "loading" | "success"> {
  if (message.includes("already exists")) return "error"
  if (message.includes("not found")) return "error"
  return "error"
}