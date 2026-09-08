/**
 * The trust levels a CUIT can be assigned, and how each one looks.
 *
 * This list is the only place that knows what a `levelOfTrust` number means.
 * The API stores and serves a bare number and validates nothing, so adding a
 * level is adding one entry here — the dropdown in the node detail, the badge
 * in every table, and the label everywhere else all read from this array.
 *
 * Level 0 is not an assignment: it is what a CUIT nobody has classified comes
 * back as. That is why it carries no badge — marking every unclassified CUIT
 * would drown the few that are actually marked.
 */

/** How a level is drawn where it appears as a badge. */
export type TrustTone = "none" | "danger"

export interface TrustLevel {
  value: number
  label: string
  /** "none" keeps the level out of the tables; it still shows in the form. */
  tone: TrustTone
}

/**
 * Sorted by value, and sorted here rather than trusted to stay that way: this
 * is the order the dropdown lists, so a level appended out of order later
 * would shuffle a menu people navigate by position.
 */
export const TRUST_LEVELS: TrustLevel[] = (
  [
    { value: 0, label: "Sin nivel", tone: "none" },
    { value: 1, label: "Ignorar", tone: "danger" },
  ] satisfies TrustLevel[]
).sort((a, b) => a.value - b.value)

const BY_VALUE = new Map(TRUST_LEVELS.map((level) => [level.value, level]))

/**
 * The level a stored number stands for, or undefined for a number this
 * frontend does not know yet.
 *
 * Undefined is a real case worth handling rather than defaulting away: the API
 * accepts any number, so a value written by a newer version of the app, or by
 * hand in the database, reaches a client that has never heard of it.
 */
export function getTrustLevel(value: number | undefined): TrustLevel | undefined {
  if (value === undefined) return undefined
  return BY_VALUE.get(value)
}

/**
 * The classes that tint a whole table row for a level, hover included.
 *
 * Returns the hover state too, rather than letting callers append a tint to
 * their usual `hover:bg-accent/50`: two hover utilities on one element have
 * equal specificity, so which one wins comes down to their order in the
 * generated stylesheet, not the order in the class string. The caller picks
 * one set or the other.
 *
 * Empty for a level with nothing to say, which the caller replaces with its
 * normal row classes.
 */
export function trustRowClass(value: number | undefined): string {
  if (getTrustLevel(value)?.tone !== "danger") return ""
  return "bg-destructive/10 hover:bg-destructive/20"
}

/**
 * The label to show for a stored number. Falls back to the raw number so an
 * unknown level is visible instead of silently reading as "Sin nivel".
 */
export function formatTrustLevel(value: number | undefined): string {
  if (value === undefined) return TRUST_LEVELS[0]!.label
  return getTrustLevel(value)?.label ?? `Nivel ${value}`
}
