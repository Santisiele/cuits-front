import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthApiService } from "@/services/api"
import { useAuthStore } from "@/store/useAuthStore"

type LoginStatus = "idle" | "loading" | "error"

interface LoginModalProps {
  /** Whether the modal is currently open. */
  open: boolean
  /** Called when the user closes the modal. */
  onClose: () => void
  /** Current theme — passed to apply dark mode inside the portal. */
  theme: "light" | "dark"
}

/**
 * Login modal overlay.
 * Shown on top of the app when the user clicks "Iniciar sesión".
 */
export function LoginModal({ open, onClose, theme }: LoginModalProps) {
  const { setAuth } = useAuthStore()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState<LoginStatus>("idle")
  const [errorMessage, setErrorMessage] = useState("")

  // Reset form state when modal closes
  function handleClose(): void {
    setUsername("")
    setPassword("")
    setStatus("idle")
    setErrorMessage("")
    onClose()
  }

  if (!open) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    if (!username.trim() || !password.trim()) return

    setStatus("loading")
    setErrorMessage("")

    try {
      const { token, username: loggedInAs } = await AuthApiService.login(
        username.trim(),
        password
      )
      setAuth(token, loggedInAs)
      handleClose()
    } catch (error) {
      setStatus("error")
      setErrorMessage(
        error instanceof Error ? error.message : "Error al iniciar sesión"
      )
    }
  }

  return (
    /* Backdrop — wraps in theme class so dark mode CSS vars apply inside the portal */
    <div
      className={`${theme} fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm`}
      onClick={handleClose}
    >
      {/* Modal card — stop click propagation so clicking inside doesn't close */}
      <div
        className="w-full max-w-sm mx-4 rounded-xl shadow-2xl p-6"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--card-foreground)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-1">Iniciar sesión</h2>
        <p className="text-muted-foreground text-sm mb-5">
          Ingresá tus credenciales para continuar
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Usuario</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="usuario"
              autoComplete="username"
              autoFocus
              disabled={status === "loading"}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Contraseña</label>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
              autoComplete="current-password"
              disabled={status === "loading"}
            />
          </div>

          {status === "error" && (
            <p className="text-destructive text-sm">{errorMessage}</p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="submit"
              className="flex-1"
              disabled={status === "loading" || !username.trim() || !password.trim()}
            >
              {status === "loading" ? "Ingresando..." : "Ingresar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={status === "loading"}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}