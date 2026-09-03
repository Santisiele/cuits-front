/**
 * Extracts a human-readable message from an unknown error value.
 * @param error - The caught error (unknown type)
 * @param fallback - Fallback message if the error has no message
 */
export function getErrorMessage(error: unknown, fallback = "Error desconocido"): string {
  if (error instanceof Error) return error.message
  return fallback
}

/**
 * Known API error messages mapped to user-facing Spanish strings.
 *
 * Matching is by substring, in insertion order, so the specific entries have
 * to come before the loose ones: "Relationship not found" would otherwise be
 * swallowed by the bare "not found" below it and read as a missing CUIT.
 */
export const API_ERROR_MESSAGES: Record<string, string> = {
  "Tax ID not found in graph": "CUIT no encontrado en el grafo",
  "No path found between the two Tax IDs": "No se encontró ningún camino entre los dos CUITs",
  "From and To Tax IDs must be different": "Los dos CUITs deben ser distintos",
  "Relationship not found": "La relación no existe",
  "CUIT not found in any source": "No se encontró el CUIT en ninguna fuente",
  "already exists": "Esta relación ya existe entre los dos CUITs",
  "not found": "Uno o ambos CUITs no existen en el grafo",
  "Invalid CUIT format": "Formato de CUIT inválido. Se espera XX-XXXXXXXX-X",
  "All sources failed": "Fallaron todas las fuentes. Intentá de nuevo",
  "Invalid date format": "Formato de fecha inválido. Usá dd/mm/aaaa",
  "Invalid maxDepth": "Profundidad inválida",
  "Invalid relationship type code": "Tipo de relación inválido",
  "Invalid username or password": "Usuario o contraseña incorrectos",
  "Graph database unavailable": "Error del servidor. Intentá de nuevo",
  "Request failed": "No se pudo completar la operación",

  // Source administration. The API answers in English; these are the strings
  // the user actually reads. Matching is by substring, so the fragments below
  // deliberately leave out the interpolated names and counts.
  "Password required for this operation": "Ingresá tu contraseña para confirmar",
  "Invalid password": "Contraseña incorrecta",
  "is already in use": "Ese nombre ya existe. Usá unificar en su lugar",
  "cannot be merged into itself": "No se puede unificar una fuente consigo misma",
  "Cannot merge sources of different categories":
    "Solo se pueden unificar fuentes de la misma categoría",
  "does not exist": "No existe",
  "does not belong to source": "El CUIT no pertenece a esa fuente",
  "fromSource is required in move mode": "Falta indicar la fuente de origen",
  "The new name cannot be empty": "El nuevo nombre no puede estar vacío",
  "Name search requires at least 3 characters":
    "La búsqueda por nombre necesita al menos 3 caracteres"
}


/**
 * Translates a known API error message to Spanish.
 * Returns the original message if no translation is found.
 * @param message - Raw error message from the API
 */
export function translateApiError(message: string): string {
  for (const [key, translation] of Object.entries(API_ERROR_MESSAGES)) {
    if (message.includes(key)) return translation
  }
  return message
}