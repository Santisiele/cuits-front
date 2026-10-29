/**
 * Extracts a human-readable message from an unknown error value.
 * @param error - The caught error (unknown type)
 * @param fallback - Fallback message if the error has no message
 */
export function getErrorMessage(error: unknown, fallback = "Error desconocido"): string {
  if (error instanceof Error && error.name === "ApiError") return error.message
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
  "That trust level does not exist": "Ese nivel no existe",
  "Another level already uses that name": "Ya hay otro nivel con ese nombre",
  "The label cannot be empty": "El nombre no puede estar vacío",
  "The label cannot be longer than": "El nombre es demasiado largo",
  "is not an available color": "Ese color no está disponible",
  "There is no list for level 0": "El nivel 0 es la ausencia de nivel: no tiene lista de CUITs",
  "Level 0 stands for having no level":
    "El nivel 0 es la ausencia de nivel: no se puede editar ni borrar",
  "The level must be a whole number": "El nivel tiene que ser un número entero",
  "CUIT not found in any source": "No se encontró el CUIT en ninguna fuente",
  "already exists": "Esta relación ya existe entre los dos CUITs",
  "not found": "Uno o ambos CUITs no existen en el grafo",
  "Invalid CUIT format": "Formato de CUIT inválido. Se espera XX-XXXXXXXX-X",
  "All sources failed": "Fallaron todas las fuentes. Intentá de nuevo",
  "Invalid date format": "Formato de fecha inválido. Usá dd/mm/aaaa",
  "The end date cannot be earlier than the start date":
    "La fecha de fin no puede ser anterior a la de inicio",
  "Invalid maxDepth": "Profundidad inválida",
  "Invalid relationship type code": "Tipo de relación inválido",
  "Invalid username or password": "Usuario o contraseña incorrectos",
  "Login failed": "No se pudo iniciar sesión",
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


export const API_ERROR_CODES: Record<string, string> = {
  forbidden: "No tenés permiso para esto",
  invalid_username: "El usuario tiene que tener entre 3 y 32 letras, números, puntos, guiones o guiones bajos",
  invalid_password: "La contraseña tiene que tener entre 8 y 72 caracteres",
  invalid_role: "El rol no es válido",
  invalid_disabled: "El estado no es válido",
  username_taken: "Ese usuario ya existe",
  user_not_found: "El usuario no existe",
  wrong_password: "La contraseña actual es incorrecta",
  creator_only: "Solo el creador puede hacer esto",
  cannot_change_creator: "El creador no se puede modificar",
  invalid_cuit: "El CUIT no es válido",
  invalid_limit: "El tope tiene que ser un número mayor o igual a 0",
  cuit_not_found: "Ese CUIT no existe en la base",
  budget_exhausted: "Se alcanzó el tope de gasto del mes",
  research_failed: "No se pudo completar la búsqueda. Intentá de nuevo",
  research_off: "La investigación web no está configurada",
  research_not_found: "La búsqueda no existe",
  already_archived: "Ya estaba archivado",
  not_archived: "No está archivado",
  network_error: "No se pudo conectar con el servidor. Revisá tu conexión",
  business_name_required: "Falta la razón social",
  full_name_required: "Falta el nombre",
  company_required: "El contacto tiene que trabajar en al menos una empresa",
  invalid_date: "La fecha no es válida",
  text_too_long: "El texto es demasiado largo",
  company_not_in_crm: "La empresa no está en el CRM",
  already_in_crm: "La empresa ya está en el CRM",
  contact_not_found: "El contacto no existe",
  cuil_already_set: "El contacto ya tiene CUIL",
  description_required: "Falta la descripción",
  cancel_reason_required: "Indicá por qué se cancela la tarea",
  invalid_status: "La tarea solo se puede marcar hecha o cancelada",
  task_not_open: "La tarea ya no está abierta",
  task_other_company: "La tarea es de otra empresa",
  action_not_found: "La acción no existe",
  task_not_found: "La tarea no existe",
  invalid_entity: "No se encontró el historial",
  invalid_color: "Ese color no está disponible",
  next_task_required: "Cada acción tiene que dejar la próxima tarea",
  close_reason_required: "Indicá por qué la empresa no va más",
  company_closed: "La empresa está cerrada",
  not_closed: "La empresa no está cerrada",
  source_not_found: "Esa fuente no existe",
}

export const GENERIC_API_ERROR = "No se pudo completar la operación. Intentá de nuevo"

export function translateByStatus(status: number | undefined): string {
  if (status === 429) return "Demasiadas solicitudes, intentá de nuevo en un minuto"
  if (status !== undefined && status >= 500) return "Error del servidor. Intentá de nuevo"
  return GENERIC_API_ERROR
}

export function translateApiFailure(code: string | undefined, message: string, status?: number): string {
  if (code && Object.prototype.hasOwnProperty.call(API_ERROR_CODES, code)) return API_ERROR_CODES[code]!
  return translateApiError(message) ?? translateByStatus(status)
}

/**
 * Translates a known API error message to Spanish.
 * Returns undefined if no translation is found.
 * @param message - Raw error message from the API
 */
export function translateApiError(message: string): string | undefined {
  for (const [key, translation] of Object.entries(API_ERROR_MESSAGES)) {
    if (message.includes(key)) return translation
  }
  return undefined
}