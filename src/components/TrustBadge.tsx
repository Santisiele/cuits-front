import { Badge } from "@/components/ui/badge"
import { getTrustLevel } from "@/lib/trustLevels"

/**
 * The trust level of a CUIT, as a badge for table rows.
 *
 * Renders nothing for levels drawn as "none" — today that is level 0, the
 * unclassified default, which nearly every CUIT carries. A badge on all of
 * them would say nothing and bury the ones that are actually marked.
 *
 * A level this build does not know about still shows, in neutral, rather than
 * disappearing: a value written by a newer version of the app is exactly the
 * case where a silent row is most misleading.
 */
export function TrustBadge({ level }: { level: number | undefined }) {
  if (level === undefined) return null
  const known = getTrustLevel(level)
  if (known?.tone === "none") return null

  return (
    <Badge
      variant={known?.tone === "danger" ? "destructive" : "outline"}
      /* Every use so far sits right after a name, and JSX drops the newline
         between them, so the gap belongs here rather than in six call sites. */
      className="ml-2 align-middle text-xs"
    >
      {known?.label ?? `Nivel ${level}`}
    </Badge>
  )
}
