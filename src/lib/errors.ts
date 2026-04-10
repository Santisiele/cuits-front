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
 */
export const API_ERROR_MESSAGES: Record<string, string> = {
  "Tax ID not found in graph": "CUIT no encontrado en el grafo",
  "No path found between the two Tax IDs": "No se encontró ningún camino entre los dos CUITs",
  "From and To Tax IDs must be different": "Los dos CUITs deben ser distintos",
  "already exists": "Esta relación ya existe entre los dos CUITs",
  "not found": "Uno o ambos CUITs no existen en el grafo",
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