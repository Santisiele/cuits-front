import { RelationshipForm } from "@/components/RelationshipForm"
import { GraphService } from "@/services/api"

interface AddRelationshipProps {
  /** Optional callback invoked after a relationship is created successfully. */
  onSuccess?: () => void
}

/** Status messages shown after a submission attempt. */
const STATUS_MESSAGES = {
  idle: null,
  loading: null,
  success: { text: "Relación creada exitosamente", variant: "default" as const },
  error: { text: "Error al crear la relación", variant: "destructive" as const },
  duplicate: { text: "Esta relación ya existe entre los dos CUITs", variant: "destructive" as const },
  not_found: { text: "Uno o ambos CUITs no existen en el grafo", variant: "destructive" as const },
}

/**
 * Form to manually add a directed relationship between two Tax IDs.
 *
 * Delegates rendering and local state to {@link RelationshipForm}
 * and provides the add-specific API call and status messages.
 */
export function AddRelationship({ onSuccess }: AddRelationshipProps) {
  async function handleSubmit(
    fromTaxId: string,
    toTaxId: string,
    relationshipType: number
  ): Promise<void> {
    await GraphService.addRelationship(fromTaxId, toTaxId, relationshipType)
  }

  return (
    <RelationshipForm
      title="Agregar relación manual"
      submitLabel="Agregar relación"
      loadingLabel="Guardando..."
      statusMessages={STATUS_MESSAGES}
      onSubmit={handleSubmit}
      onSuccess={onSuccess}
    />
  )
}