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
  "Invalid username or password": "Usuario o contraseña incorrectos",
  "Graph database unavailable": "Error del servidor. Intentá de nuevo",
  "Request failed": "No se pudo completar la operación"
}

/**
 * The source admin endpoints already answer in Spanish — "Password incorrecta",
 * 'La fuente "X" no existe', 'El nombre "Y" ya está en uso. Usá merge en su
 * lugar.' — so they are deliberately absent from the map above: translating
 * them would be an identity mapping, and adding entries here would only hide
 * the more specific wording the backend already provides (which source, which
 * name). Only the messages that reach the user in English are listed.
 */

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