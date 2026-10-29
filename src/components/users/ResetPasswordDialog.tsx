import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useUserMutations } from "@/hooks/useUsers"
import { getErrorMessage } from "@/lib/errors"
import { passwordError } from "@/lib/users"

export function ResetPasswordDialog({ username, onClose }: { username: string; onClose: () => void }) {
  const { resetPassword } = useUserMutations()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const problem = password ? passwordError(password) : null
  const canSubmit = !!password && !problem && !resetPassword.isPending

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    if (!canSubmit) return
    setError("")
    try {
      await resetPassword.mutateAsync({ username, password })
      toast.success(`Se cambió la contraseña de ${username}`)
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resetear la contraseña de {username}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="reset-password">Contraseña nueva</label>
            <Input
              id="reset-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              autoFocus
            />
            {problem && <p className="text-destructive text-sm">{problem}</p>}
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={resetPassword.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {resetPassword.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
