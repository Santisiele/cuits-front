/**
 * Maps English relationship type names returned by the API to Spanish display labels.
 * Extend this record as new relationship types are discovered.
 */
export const RELATIONSHIP_LABELS: Record<string, string> = {
  "Principal": "Principal",
  "Employer": "Empleador",
  "Employee": "Empleado",
  "President": "Presidente",
  "Director": "Director",
  "Vice President": "Vicepresidente",
  "Deputy Director": "Director Suplente",
  "Brand Owner": "Titular de Marca",
  "Check Signer": "Firmante de Cheques",
  "Administrator": "Administrador",
  "Deputy Administrator": "Administrador Suplente",
  "Child": "Hijo/a",
  "Parent": "Padre/madre",
  "Former President": "Ex Presidente",
  "Brother": "Hermano",
  "Sister": "Hermana",
  "Cousin": "Primo/a",
  "Friend": "Amigo/a",
}

/**
 * Maps numeric relationship type codes (as used by the API) to Spanish display labels.
 * Used to populate relationship selectors in forms.
 */
export const RELATIONSHIP_OPTIONS: Record<number, string> = {
  1: "Principal",
  4: "Firmante de Cheques",
  8: "Empleador",
  20: "Presidente",
  21: "Director",
  27: "Administrador",
  51: "Vicepresidente",
  95: "Director Suplente",
  161: "Administrador Suplente",
  164: "Titular de Marca",
  176: "Empleado",
  1001: "Hijo/a",
  1002: "Padre/Madre",
  1003: "Hermano",
  1004: "Hermana",
  1005: "Primo/a",
  1006: "Amigo/a",
}

/**
 * Returns the Spanish display label for a given English relationship type string.
 * Falls back to the original value if no mapping exists.
 *
 * @param type - Relationship type string as returned by the API
 * @example
 * getRelationshipLabel("President") // → "Presidente"
 * getRelationshipLabel("Unknown")   // → "Unknown"
 */
export function getRelationshipLabel(type: string): string {
  return RELATIONSHIP_LABELS[type] ?? type
}