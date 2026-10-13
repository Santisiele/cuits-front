import { useState } from "react"
import { KeyRound, Plus, ShieldCheck, ShieldOff, UserCheck, UserX } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreateUserDialog } from "@/components/users/CreateUserDialog"
import { ResetPasswordDialog } from "@/components/users/ResetPasswordDialog"
import { useUserMutations, useUsersQuery } from "@/hooks/useUsers"
import { useAuthStore } from "@/store/useAuthStore"
import { ROLE_LABELS } from "@/lib/roles"
import { allowedUserActions } from "@/lib/users"
import { formatIsoDate } from "@/lib/dates"
import { getErrorMessage } from "@/lib/errors"
import type { AppUser } from "@/types"

export function UsersTable() {
  const { data: users = [], isLoading, error } = useUsersQuery()
  const { update } = useUserMutations()
  const actorRole = useAuthStore((state) => state.role)
  const me = useAuthStore((state) => state.username)
  const [creating, setCreating] = useState(false)
  const [resetting, setResetting] = useState<string | null>(null)
  const [actionError, setActionError] = useState("")

  async function change(user: AppUser, changes: { role?: string; disabled?: boolean }): Promise<void> {
    setActionError("")
    try {
      await update.mutateAsync({ username: user.username, changes })
    } catch (err) {
      setActionError(getErrorMessage(err))
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
          <CardTitle>Usuarios ({users.length})</CardTitle>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Nuevo usuario
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {actionError && <p className="text-destructive text-sm mb-3">{actionError}</p>}
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Cargando...</p>
        ) : error ? (
          <p className="text-destructive text-sm">Error al cargar los usuarios</p>
        ) : (
          <div className="divide-y divide-border">
            {users.map((user) => {
              const actions = allowedUserActions(actorRole, user.role)
              return (
                <div
                  key={user.username}
                  data-testid={`user-${user.username}`}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between py-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{user.username}</span>
                      {user.username === me && <span className="text-xs text-muted-foreground">(vos)</span>}
                      <Badge variant={user.role === "member" ? "secondary" : "default"}>{ROLE_LABELS[user.role]}</Badge>
                      {user.disabled && <Badge variant="destructive">Deshabilitado</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">Creado el {formatIsoDate(user.createdAt)}</p>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {actions.makeAdmin && (
                      <Button variant="outline" size="sm" disabled={update.isPending} onClick={() => void change(user, { role: "admin" })}>
                        <ShieldCheck className="w-4 h-4 mr-1" />
                        Hacer admin
                      </Button>
                    )}
                    {actions.makeMember && (
                      <Button variant="outline" size="sm" disabled={update.isPending} onClick={() => void change(user, { role: "member" })}>
                        <ShieldOff className="w-4 h-4 mr-1" />
                        Quitar admin
                      </Button>
                    )}
                    {actions.toggleDisabled && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={update.isPending}
                        onClick={() => void change(user, { disabled: !user.disabled })}
                      >
                        {user.disabled ? <UserCheck className="w-4 h-4 mr-1" /> : <UserX className="w-4 h-4 mr-1" />}
                        {user.disabled ? "Habilitar" : "Deshabilitar"}
                      </Button>
                    )}
                    {actions.resetPassword && (
                      <Button variant="outline" size="sm" onClick={() => setResetting(user.username)}>
                        <KeyRound className="w-4 h-4 mr-1" />
                        Resetear contraseña
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      {creating && <CreateUserDialog onClose={() => setCreating(false)} />}
      {resetting && <ResetPasswordDialog username={resetting} onClose={() => setResetting(null)} />}
    </Card>
  )
}
