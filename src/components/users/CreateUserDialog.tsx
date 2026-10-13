import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useUserMutations } from "@/hooks/useUsers"
import { getErrorMessage } from "@/lib/errors"
import { ROLE_LABELS } from "@/lib/roles"
import { CREATABLE_ROLES, passwordError, usernameError, type CreatableRole } from "@/lib/users"

export function CreateUserDialog({ onClose }: { onClose: () => void }) {
  const { create } = useUserMutations()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<CreatableRole>("member")
  const [error, setError] = useState("")

  const usernameProblem = username ? usernameError(username) : null
  const passwordProblem = password ? passwordError(password) : null
  const canSubmit = !!username && !!password && !usernameProblem && !passwordProblem && !create.isPending

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    if (!canSubmit) return
    setError("")
    try {
      await create.mutateAsync({ username: username.trim(), password, role })
      toast.success(`Se creó el usuario ${username.trim()}`)
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo usuario</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="new-user-username">Usuario</label>
            <Input
              id="new-user-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
              autoFocus
            />
            {usernameProblem && <p className="text-destructive text-sm">{usernameProblem}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="new-user-password">Contraseña</label>
            <Input
              id="new-user-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            {passwordProblem && <p className="text-destructive text-sm">{passwordProblem}</p>}
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Rol</span>
            <div className="flex gap-2">
              {CREATABLE_ROLES.map((option) => (
                <Button
                  key={option}
                  type="button"
                  size="sm"
                  variant={role === option ? "default" : "outline"}
                  aria-pressed={role === option}
                  onClick={() => setRole(option)}
                >
                  {ROLE_LABELS[option]}
                </Button>
              ))}
            </div>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={create.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {create.isPending ? "Creando..." : "Crear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
