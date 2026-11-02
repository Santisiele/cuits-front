interface ResponsiblePaletteEntry {
  label: string
  badge: string
  row: string
  swatch: string
}

export const RESPONSIBLE_PALETTE = {
  red: { label: "Rojo", badge: "bg-red-500/15 text-red-700 dark:text-red-400", row: "bg-red-500/10 hover:bg-red-500/20", swatch: "bg-red-500" },
  orange: { label: "Naranja", badge: "bg-orange-500/15 text-orange-700 dark:text-orange-400", row: "bg-orange-500/10 hover:bg-orange-500/20", swatch: "bg-orange-500" },
  amber: { label: "Ámbar", badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400", row: "bg-amber-500/10 hover:bg-amber-500/20", swatch: "bg-amber-500" },
  yellow: { label: "Amarillo", badge: "bg-yellow-400/25 text-yellow-800 dark:text-yellow-300", row: "bg-yellow-400/15 hover:bg-yellow-400/25", swatch: "bg-yellow-400" },
  lime: { label: "Lima", badge: "bg-lime-500/15 text-lime-700 dark:text-lime-400", row: "bg-lime-500/10 hover:bg-lime-500/20", swatch: "bg-lime-500" },
  green: { label: "Verde", badge: "bg-green-500/15 text-green-700 dark:text-green-400", row: "bg-green-500/10 hover:bg-green-500/20", swatch: "bg-green-500" },
  emerald: { label: "Esmeralda", badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400", row: "bg-emerald-500/10 hover:bg-emerald-500/20", swatch: "bg-emerald-500" },
  teal: { label: "Turquesa", badge: "bg-teal-500/15 text-teal-700 dark:text-teal-400", row: "bg-teal-500/10 hover:bg-teal-500/20", swatch: "bg-teal-500" },
  violet: { label: "Violeta", badge: "bg-violet-500/15 text-violet-700 dark:text-violet-400", row: "bg-violet-500/10 hover:bg-violet-500/20", swatch: "bg-violet-500" },
  purple: { label: "Púrpura", badge: "bg-purple-500/15 text-purple-700 dark:text-purple-400", row: "bg-purple-500/10 hover:bg-purple-500/20", swatch: "bg-purple-500" },
  fuchsia: { label: "Fucsia", badge: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-400", row: "bg-fuchsia-500/10 hover:bg-fuchsia-500/20", swatch: "bg-fuchsia-500" },
  pink: { label: "Rosa", badge: "bg-pink-500/15 text-pink-700 dark:text-pink-400", row: "bg-pink-500/10 hover:bg-pink-500/20", swatch: "bg-pink-500" },
  rose: { label: "Frambuesa", badge: "bg-rose-500/15 text-rose-700 dark:text-rose-400", row: "bg-rose-500/10 hover:bg-rose-500/20", swatch: "bg-rose-500" },
  slate: { label: "Gris", badge: "bg-slate-500/15 text-slate-700 dark:text-slate-300", row: "bg-slate-500/10 hover:bg-slate-500/20", swatch: "bg-slate-500" },
  "sky-300": { label: "Celeste claro", badge: "bg-sky-300/25 text-sky-800 dark:text-sky-200", row: "bg-sky-300/15 hover:bg-sky-300/25", swatch: "bg-sky-300" },
  "sky-500": { label: "Celeste", badge: "bg-sky-500/15 text-sky-700 dark:text-sky-400", row: "bg-sky-500/10 hover:bg-sky-500/20", swatch: "bg-sky-500" },
  "sky-700": { label: "Celeste oscuro", badge: "bg-sky-700/20 text-sky-800 dark:text-sky-300", row: "bg-sky-700/10 hover:bg-sky-700/20", swatch: "bg-sky-700" },
  "blue-300": { label: "Azul claro", badge: "bg-blue-300/25 text-blue-800 dark:text-blue-200", row: "bg-blue-300/15 hover:bg-blue-300/25", swatch: "bg-blue-300" },
  "blue-500": { label: "Azul", badge: "bg-blue-500/15 text-blue-700 dark:text-blue-400", row: "bg-blue-500/10 hover:bg-blue-500/20", swatch: "bg-blue-500" },
  "blue-700": { label: "Azul oscuro", badge: "bg-blue-700/20 text-blue-800 dark:text-blue-300", row: "bg-blue-700/10 hover:bg-blue-700/20", swatch: "bg-blue-700" },
  "blue-900": { label: "Azul marino", badge: "bg-blue-900/25 text-blue-900 dark:text-blue-200", row: "bg-blue-900/15 hover:bg-blue-900/25", swatch: "bg-blue-900" },
  "indigo-300": { label: "Índigo claro", badge: "bg-indigo-300/25 text-indigo-800 dark:text-indigo-200", row: "bg-indigo-300/15 hover:bg-indigo-300/25", swatch: "bg-indigo-300" },
  "indigo-500": { label: "Índigo", badge: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400", row: "bg-indigo-500/10 hover:bg-indigo-500/20", swatch: "bg-indigo-500" },
  "indigo-700": { label: "Índigo oscuro", badge: "bg-indigo-700/20 text-indigo-800 dark:text-indigo-300", row: "bg-indigo-700/10 hover:bg-indigo-700/20", swatch: "bg-indigo-700" },
  "cyan-500": { label: "Cian", badge: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400", row: "bg-cyan-500/10 hover:bg-cyan-500/20", swatch: "bg-cyan-500" },
  "cyan-700": { label: "Cian oscuro", badge: "bg-cyan-700/20 text-cyan-800 dark:text-cyan-300", row: "bg-cyan-700/10 hover:bg-cyan-700/20", swatch: "bg-cyan-700" },
} as const satisfies Record<string, ResponsiblePaletteEntry>

export type ResponsibleColor = keyof typeof RESPONSIBLE_PALETTE

export const RESPONSIBLE_COLOR_KEYS = Object.keys(RESPONSIBLE_PALETTE) as ResponsibleColor[]

export function responsiblePalette(color: string | null | undefined): ResponsiblePaletteEntry {
  return RESPONSIBLE_PALETTE[(color ?? "slate") as ResponsibleColor] ?? RESPONSIBLE_PALETTE.slate
}
