import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/crm/CrmFields"
import { useActivity } from "@/hooks/useActivity"
import { useUsersQuery } from "@/hooks/useUsers"
import { ACTIVITY_EVENT_LABELS, describeActivity } from "@/lib/activity"
import { formatIsoDateTime } from "@/lib/dates"
import { getErrorMessage } from "@/lib/errors"
import { cn } from "@/lib/utils"

export function ActivityScreen() {
  const [username, setUsername] = useState("")
  const [event, setEvent] = useState("")
  const filters = { username, event }
  const usernames = (useUsersQuery().data ?? []).map((user) => user.username).sort((a, b) => a.localeCompare(b))

  const activity = useActivity(filters)

  const entries = activity.data?.pages.flatMap((page) => page.entries) ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registro de actividad</CardTitle>
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <NativeSelect aria-label="Usuario" value={username} onChange={(e) => setUsername(e.target.value)} className="sm:w-48">
            <option value="">Todos los usuarios</option>
            {usernames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </NativeSelect>
          <NativeSelect aria-label="Tipo" value={event} onChange={(e) => setEvent(e.target.value)} className="sm:w-64">
            <option value="">Todo</option>
            {Object.entries(ACTIVITY_EVENT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </NativeSelect>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {activity.isLoading ? (
          <p className="text-muted-foreground text-sm">Cargando...</p>
        ) : activity.error ? (
          <p className="text-destructive text-sm">{getErrorMessage(activity.error, "No se pudo leer el registro")}</p>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground text-sm">No hay movimientos.</p>
        ) : (
          <ol className="divide-y divide-border">
            {entries.map((entry, index) => (
              <li
                key={`${entry.time}-${index}`}
                data-testid="activity-entry"
                className={cn("py-2 text-sm flex flex-col sm:flex-row sm:items-start gap-x-4 gap-y-0.5", entry.level === "error" && "text-destructive")}
              >
                <time className="text-muted-foreground tabular-nums whitespace-nowrap">{formatIsoDateTime(entry.time)}</time>
                <span className="break-words">
                  {entry.level !== "info" && (
                    <Badge variant={entry.level === "error" ? "destructive" : "secondary"} className="mr-2">
                      {entry.level === "error" ? "Error" : "Aviso"}
                    </Badge>
                  )}
                  {describeActivity(entry)}
                </span>
              </li>
            ))}
          </ol>
        )}
        {activity.hasNextPage && (
          <Button variant="outline" size="sm" onClick={() => void activity.fetchNextPage()} disabled={activity.isFetchingNextPage}>
            {activity.isFetchingNextPage ? "Cargando..." : "Ver más"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
