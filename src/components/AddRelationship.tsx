import { RelationshipForm } from "@/components/RelationshipForm"
import { useAddRelationship } from "@/hooks/useGraphQueries"

interface AddRelationshipProps {
  onSuccess?: () => void
}

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
 * Uses React Query mutation — invalidates my-base cache on success.
 */
export function AddRelationship({ onSuccess }: AddRelationshipProps) {
  const mutation = useAddRelationship()

  async function handleSubmit(fromTaxId: string, toTaxId: string, relationshipType: number): Promise<void> {
    await mutation.mutateAsync({ fromTaxId, toTaxId, relationshipType })
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