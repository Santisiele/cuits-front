import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AuthApiService } from "@/services/api"
import { getErrorMessage } from "@/lib/errors"
import { passwordError } from "@/lib/users"

export function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const newProblem = newPassword ? passwordError(newPassword) : null
  const mismatch = !!confirmation && confirmation !== newPassword
  const canSubmit = !!currentPassword && !!newPassword && !newProblem && confirmation === newPassword && !saving

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    if (!canSubmit) return
    setSaving(true)
    setError("")
    try {
      await AuthApiService.changePassword(currentPassword, newPassword)
      toast.success("Se cambió tu contraseña")
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="current-password">Contraseña actual</label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="new-password">Contraseña nueva</label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
            {newProblem && <p className="text-destructive text-sm">{newProblem}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="confirm-password">Repetí la contraseña nueva</label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              autoComplete="new-password"
            />
            {mismatch && <p className="text-destructive text-sm">Las contraseñas no coinciden</p>}
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
