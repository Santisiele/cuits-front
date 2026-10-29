import { useState } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCrmResponsibles, useCrmUsers, useResponsibleMutations } from "@/hooks/useCrm"
import { getErrorMessage } from "@/lib/errors"
import { responsibleNameError } from "@/lib/crm"
import { RESPONSIBLE_COLOR_KEYS, RESPONSIBLE_PALETTE, responsiblePalette } from "@/lib/responsibleColors"
import { cn } from "@/lib/utils"
import type { CrmResponsible } from "@/types"
import { CheckRow } from "./CrmFields"

function ColorPicker({ name, color, disabled, onChange }: { name: string; color: string; disabled: boolean; onChange: (color: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1" role="radiogroup" aria-label={`Color de ${name}`}>
      {RESPONSIBLE_COLOR_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={color === key}
          aria-label={RESPONSIBLE_PALETTE[key].label}
          title={RESPONSIBLE_PALETTE[key].label}
          disabled={disabled}
          onClick={() => color !== key && onChange(key)}
          className={cn(
            "h-4 w-4 transition-transform hover:scale-110 disabled:opacity-50",
            RESPONSIBLE_PALETTE[key].swatch,
            color === key && "ring-2 ring-offset-1 ring-foreground"
          )}
        />
      ))}
    </div>
  )
}

function ResponsibleRow({ responsible, usernames }: { responsible: CrmResponsible; usernames: string[] }) {
  const { update } = useResponsibleMutations()
  const [name, setName] = useState(responsible.name)
  const problem = responsibleNameError(name)
  const palette = responsiblePalette(responsible.color)

  async function save(input: Partial<CrmResponsible>): Promise<void> {
    try {
      await update.mutateAsync({ name: responsible.name, input })
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  function toggleUser(username: string, checked: boolean): void {
    const users = checked ? [...responsible.users, username] : responsible.users.filter((user) => user.toLowerCase() !== username.toLowerCase())
    void save({ users })
  }

  return (
    <div data-testid={`responsible-${responsible.name}`} className="py-3 space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 text-sm font-medium", palette.badge)}>
          <span className={cn("h-2.5 w-2.5", palette.swatch)} />
          {responsible.name}
        </span>
        {responsible.disabled && <Badge variant="destructive">Deshabilitado</Badge>}
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <Input
            aria-invalid={!!problem}
            aria-label={`Nombre de ${responsible.name}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 min-w-0 flex-1 basis-full sm:basis-auto sm:w-40 sm:flex-none"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={!!problem || name.trim() === responsible.name || update.isPending}
            onClick={() => void save({ name: name.trim() })}
          >
            Renombrar
          </Button>
          <Button size="sm" variant="outline" disabled={update.isPending} onClick={() => void save({ disabled: !responsible.disabled })}>
            {responsible.disabled ? "Habilitar" : "Deshabilitar"}
          </Button>
        </div>
      </div>
      {problem && <p className="text-destructive text-xs sm:text-right">{problem}</p>}
      <ColorPicker name={responsible.name} color={responsible.color} disabled={update.isPending} onChange={(color) => void save({ color })} />
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <span className="text-muted-foreground">Lo usan:</span>
        {usernames.map((username) => (
          <CheckRow
            key={username}
            checked={responsible.users.some((user) => user.toLowerCase() === username.toLowerCase())}
            disabled={update.isPending}
            onChange={(checked) => toggleUser(username, checked)}
          >
            {username}
          </CheckRow>
        ))}
      </div>
    </div>
  )
}

export function ResponsiblesScreen() {
  const responsibles = useCrmResponsibles()
  const users = useCrmUsers()
  const { create } = useResponsibleMutations()
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const problem = name ? responsibleNameError(name) : null
  const usernames = (users.data ?? []).map((user) => user.username)

  async function add(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    if (!name.trim() || problem) return
    setError("")
    try {
      await create.mutateAsync({ name: name.trim(), color: "blue-500", users: [] })
      setName("")
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Responsables</CardTitle>
        <p className="text-sm text-muted-foreground">
          Quién hizo cada acción y a quién se le asigna cada tarea. "Lo usan" son los usuarios de la app que ven esas tareas como propias.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={(e) => void add(e)} className="flex flex-col sm:flex-row gap-2">
          <Input aria-label="Nuevo responsable" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" className="sm:max-w-xs" />
          <Button type="submit" size="sm" disabled={!name.trim() || !!problem || create.isPending}>
            <Plus className="w-4 h-4 mr-1" />
            Agregar
          </Button>
        </form>
        {problem && <p className="text-destructive text-sm">{problem}</p>}
        {error && <p className="text-destructive text-sm">{error}</p>}
        {responsibles.isLoading ? (
          <p className="text-muted-foreground text-sm">Cargando...</p>
        ) : responsibles.error ? (
          <p className="text-destructive text-sm">{getErrorMessage(responsibles.error)}</p>
        ) : (
          <div className="divide-y divide-border">
            {(responsibles.data ?? []).length === 0 && <p className="py-3 text-sm text-muted-foreground">Todavía no hay responsables.</p>}
            {(responsibles.data ?? []).map((responsible) => (
              <ResponsibleRow key={`${responsible.name}|${responsible.color}`} responsible={responsible} usernames={usernames} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
