export const BASE_TITLE = "Buscador de CUIT"

export function appTitle(environment: string | undefined = import.meta.env.VITE_ENV_LABEL): string {
  const label = environment?.trim().toUpperCase()
  return label ? `${BASE_TITLE} - ${label}` : BASE_TITLE
}
