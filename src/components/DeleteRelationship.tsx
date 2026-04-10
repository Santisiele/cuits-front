import { RelationshipForm } from "@/components/RelationshipForm"
import { GraphService } from "@/services/api"

interface DeleteRelationshipProps {
  /** Optional callback invoked after a relationship is deleted successfully. */
  onSuccess?: () => void
}

/** Status messages shown after a submission attempt. */
const STATUS_MESSAGES = {
  idle: null,
  loading: null,
  success: { text: "Relación eliminada exitosamente", variant: "default" as const },
  error: { text: "Error al eliminar la relación", variant: "destructive" as const },
  not_found: { text: "La relación no existe entre los dos CUITs", variant: "destructive" as const },
}

/**
 * Form to delete an existing relationship between two Tax IDs.
 *
 * Delegates rendering and local state to {@link RelationshipForm}
 * and provides the delete-specific API call, styling, and status messages.
 */
export function DeleteRelationship({ onSuccess }: DeleteRelationshipProps) {
  async function handleSubmit(
    fromTaxId: string,
    toTaxId: string,
    relationshipType: number
  ): Promise<void> {
    await GraphService.deleteRelationship(fromTaxId, toTaxId, relationshipType)
  }

  return (
    <RelationshipForm
      title="Eliminar relación"
      submitLabel="Eliminar relación"
      loadingLabel="Eliminando..."
      submitVariant="destructive"
      cardClassName="border-destructive"
      titleClassName="text-destructive"
      statusMessages={STATUS_MESSAGES}
      onSubmit={handleSubmit}
      onSuccess={onSuccess}
    />
  )
}