interface UserPaletteEntry {
  label: string
  badge: string
  row: string
  swatch: string
}

export const USER_PALETTE = {
  red: { label: "Rojo", badge: "bg-red-500/15 text-red-700 dark:text-red-400", row: "bg-red-500/10 hover:bg-red-500/20", swatch: "bg-red-500" },
  orange: { label: "Naranja", badge: "bg-orange-500/15 text-orange-700 dark:text-orange-400", row: "bg-orange-500/10 hover:bg-orange-500/20", swatch: "bg-orange-500" },
  amber: { label: "Ámbar", badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400", row: "bg-amber-500/10 hover:bg-amber-500/20", swatch: "bg-amber-500" },
  yellow: { label: "Amarillo", badge: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400", row: "bg-yellow-500/10 hover:bg-yellow-500/20", swatch: "bg-yellow-500" },
  lime: { label: "Lima", badge: "bg-lime-500/15 text-lime-700 dark:text-lime-400", row: "bg-lime-500/10 hover:bg-lime-500/20", swatch: "bg-lime-500" },
  green: { label: "Verde", badge: "bg-green-500/15 text-green-700 dark:text-green-400", row: "bg-green-500/10 hover:bg-green-500/20", swatch: "bg-green-500" },
  emerald: { label: "Esmeralda", badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400", row: "bg-emerald-500/10 hover:bg-emerald-500/20", swatch: "bg-emerald-500" },
  teal: { label: "Turquesa", badge: "bg-teal-500/15 text-teal-700 dark:text-teal-400", row: "bg-teal-500/10 hover:bg-teal-500/20", swatch: "bg-teal-500" },
  cyan: { label: "Cian", badge: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400", row: "bg-cyan-500/10 hover:bg-cyan-500/20", swatch: "bg-cyan-500" },
  sky: { label: "Celeste", badge: "bg-sky-500/15 text-sky-700 dark:text-sky-400", row: "bg-sky-500/10 hover:bg-sky-500/20", swatch: "bg-sky-500" },
  blue: { label: "Azul", badge: "bg-blue-500/15 text-blue-700 dark:text-blue-400", row: "bg-blue-500/10 hover:bg-blue-500/20", swatch: "bg-blue-500" },
  indigo: { label: "Índigo", badge: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400", row: "bg-indigo-500/10 hover:bg-indigo-500/20", swatch: "bg-indigo-500" },
  violet: { label: "Violeta", badge: "bg-violet-500/15 text-violet-700 dark:text-violet-400", row: "bg-violet-500/10 hover:bg-violet-500/20", swatch: "bg-violet-500" },
  purple: { label: "Púrpura", badge: "bg-purple-500/15 text-purple-700 dark:text-purple-400", row: "bg-purple-500/10 hover:bg-purple-500/20", swatch: "bg-purple-500" },
  fuchsia: { label: "Fucsia", badge: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-400", row: "bg-fuchsia-500/10 hover:bg-fuchsia-500/20", swatch: "bg-fuchsia-500" },
  pink: { label: "Rosa", badge: "bg-pink-500/15 text-pink-700 dark:text-pink-400", row: "bg-pink-500/10 hover:bg-pink-500/20", swatch: "bg-pink-500" },
  rose: { label: "Frambuesa", badge: "bg-rose-500/15 text-rose-700 dark:text-rose-400", row: "bg-rose-500/10 hover:bg-rose-500/20", swatch: "bg-rose-500" },
  slate: { label: "Gris", badge: "bg-slate-500/15 text-slate-700 dark:text-slate-300", row: "bg-slate-500/10 hover:bg-slate-500/20", swatch: "bg-slate-500" },
} as const satisfies Record<string, UserPaletteEntry>

export type UserColor = keyof typeof USER_PALETTE

export const USER_COLOR_KEYS = Object.keys(USER_PALETTE) as UserColor[]

export function isUserColor(color: string | null | undefined): color is UserColor {
  return !!color && color in USER_PALETTE
}

export function userPaletteFor(color: UserColor): UserPaletteEntry {
  return USER_PALETTE[color]
}
