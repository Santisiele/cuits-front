import type { TrustLevelColor } from "@/types"

export const NO_LEVEL_VALUE = 0
export const NO_LEVEL_LABEL = "Sin nivel"

interface PaletteEntry {
  label: string
  badge: string
  row: string
  swatch: string
}

export const TRUST_LEVEL_PALETTE: Record<TrustLevelColor, PaletteEntry> = {
  red: {
    label: "Rojo",
    badge: "bg-red-500/15 text-red-700 dark:text-red-400",
    row: "bg-red-500/10 hover:bg-red-500/20",
    swatch: "bg-red-500",
  },
  orange: {
    label: "Naranja",
    badge: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
    row: "bg-orange-500/10 hover:bg-orange-500/20",
    swatch: "bg-orange-500",
  },
  amber: {
    label: "Ámbar",
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    row: "bg-amber-500/10 hover:bg-amber-500/20",
    swatch: "bg-amber-500",
  },
  green: {
    label: "Verde",
    badge: "bg-green-500/15 text-green-700 dark:text-green-400",
    row: "bg-green-500/10 hover:bg-green-500/20",
    swatch: "bg-green-500",
  },
  teal: {
    label: "Turquesa",
    badge: "bg-teal-500/15 text-teal-700 dark:text-teal-400",
    row: "bg-teal-500/10 hover:bg-teal-500/20",
    swatch: "bg-teal-500",
  },
  blue: {
    label: "Azul",
    badge: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
    row: "bg-blue-500/10 hover:bg-blue-500/20",
    swatch: "bg-blue-500",
  },
  violet: {
    label: "Violeta",
    badge: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
    row: "bg-violet-500/10 hover:bg-violet-500/20",
    swatch: "bg-violet-500",
  },
  pink: {
    label: "Rosa",
    badge: "bg-pink-500/15 text-pink-700 dark:text-pink-400",
    row: "bg-pink-500/10 hover:bg-pink-500/20",
    swatch: "bg-pink-500",
  },
  slate: {
    label: "Gris",
    badge: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
    row: "bg-slate-500/10 hover:bg-slate-500/20",
    swatch: "bg-slate-500",
  },
}

export const TRUST_LEVEL_COLOR_KEYS = Object.keys(TRUST_LEVEL_PALETTE) as TrustLevelColor[]

export function paletteFor(color: string | undefined): PaletteEntry {
  return TRUST_LEVEL_PALETTE[color as TrustLevelColor] ?? TRUST_LEVEL_PALETTE.slate
}
