import { useState } from "react"
import { CalendarClock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDay } from "@/lib/crm"
import { formatIsoDateTime } from "@/lib/dates"
import type { CrmPostponement } from "@/types"

export function Postponements({ postponements = [] }: { postponements?: readonly CrmPostponement[] }) {
  const [open, setOpen] = useState(false)
  if (postponements.length === 0) return null
  const label = postponements.length === 1 ? "Pospuesta 1 vez" : `Pospuesta ${postponements.length} veces`

  return (
    <div>
      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <CalendarClock className="w-3.5 h-3.5 mr-1" />
        {open ? "Ocultar pospuestos" : label}
      </Button>
      {open && (
        <ol className="mt-1 space-y-1 border-l-2 border-border pl-3 text-xs" aria-label="Pospuestos">
          {[...postponements].reverse().map((item) => (
            <li key={item.at}>
              <span className="text-muted-foreground">{formatIsoDateTime(item.at)} · {item.by} · </span>
              del {formatDay(item.from)} al {formatDay(item.to)}
              {item.reason && <span className="text-muted-foreground"> · {item.reason}</span>}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
