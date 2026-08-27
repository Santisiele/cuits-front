import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface PasswordConfirmStepProps {
  loading: boolean
  /** Message from a failed attempt, shown inline so the user can retry. */
  error: string | null
  onExecute: (password: string) => void
  onBack: () => void
}

/**
 * Final step of every destructive flow: step-up authentication.
 *
 * The backend re-verifies the password on each destructive call — a valid
 * session is not enough — so this is asked once per operation and never held
 * anywhere. A wrong password is reported inline instead of closing the dialog,
 * because the preview above it would otherwise have to be run again.
 */
export function PasswordConfirmStep({
  loading,
  error,
  onExecute,
  onBack,
}: PasswordConfirmStepProps) {
  const [password, setPassword] = useState("")

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (!password || loading) return
    onExecute(password)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm">Ingresá tu contraseña para confirmar la operación.</p>

      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Contraseña"
        autoFocus
        disabled={loading}
      />

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
        <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
          Atrás
        </Button>
        <Button type="submit" disabled={loading || !password}>
          {loading ? "Ejecutando..." : "Ejecutar"}
        </Button>
      </div>
    </form>
  )
}
