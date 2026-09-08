import { Badge } from "@/components/ui/badge"
import { useTrustLevels } from "@/hooks/useTrustLevels"
import { cn } from "@/lib/utils"

export function TrustBadge({ level }: { level: number | undefined }) {
  const { labelFor, badgeClassFor } = useTrustLevels()
  const badgeClass = badgeClassFor(level)
  if (!badgeClass) return null

  return (
    <Badge variant="outline" className={cn("ml-2 align-middle border-transparent text-xs", badgeClass)}>
      {labelFor(level)}
    </Badge>
  )
}
