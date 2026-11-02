import { useState } from "react"
import { History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCrmChanges } from "@/hooks/useCrm"
import { formatIsoDateTime } from "@/lib/dates"
import { getErrorMessage } from "@/lib/errors"
import { CHANGE_FIELD_LABELS, CHANGE_OPERATION_LABELS, describeChangeValue } from "@/lib/crm"

export function ChangeHistory({ entityType, entityId, names }: { entityType: string; entityId: string; names: Readonly<Record<string, string>> }) {
  const [open, setOpen] = useState(false)
  const changes = useCrmChanges(entityType, entityId, open)

  return (
    <div>
      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setOpen((value) => !value)}>
        <History className="w-3.5 h-3.5 mr-1" />
        {open ? "Ocultar historial" : "Historial"}
      </Button>
      {open && (
        <div className="mt-1 space-y-2 border-l-2 border-border pl-3 text-xs">
          {changes.isLoading ? (
            <p className="text-muted-foreground">Cargando...</p>
          ) : changes.error ? (
            <p className="text-destructive">{getErrorMessage(changes.error)}</p>
          ) : (changes.data ?? []).length === 0 ? (
            <p className="text-muted-foreground">Sin cambios.</p>
          ) : (
            (changes.data ?? []).map((change) => (
              <div key={change.id}>
                <p className="text-muted-foreground">
                  {formatIsoDateTime(change.at)} · {change.by} · {CHANGE_OPERATION_LABELS[change.operation] ?? change.operation}
                </p>
                {Object.keys(change.after).map((field) => (
                  <p key={field}>
                    {CHANGE_FIELD_LABELS[field] ?? field}: {field in change.before && <span className="line-through text-muted-foreground mr-1">{describeChangeValue(change.before[field], names)}</span>}
                    {describeChangeValue(change.after[field], names)}
                  </p>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
