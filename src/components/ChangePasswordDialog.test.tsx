import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { render } from "@/tests/render"

const changePassword = vi.fn()
const onClose = vi.fn()

vi.mock("@/services/api", () => ({
  AuthApiService: { changePassword: (...args: unknown[]) => changePassword(...args) },
}))

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }))

const { ChangePasswordDialog } = await import("@/components/ChangePasswordDialog")

async function fill(current: string, next: string, again: string): Promise<void> {
  render(<ChangePasswordDialog onClose={onClose} />)
  if (current) await userEvent.type(screen.getByLabelText("Contraseña actual"), current)
  if (next) await userEvent.type(screen.getByLabelText("Contraseña nueva"), next)
  if (again) await userEvent.type(screen.getByLabelText("Repetí la contraseña nueva"), again)
}

describe("ChangePasswordDialog", () => {
  beforeEach(() => {
    changePassword.mockReset().mockResolvedValue({ message: "Password changed" })
    onClose.mockReset()
  })

  it("changes the password and closes", async () => {
    await fill("vieja-clave", "nueva-clave", "nueva-clave")
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }))
    expect(changePassword).toHaveBeenCalledWith("vieja-clave", "nueva-clave")
    expect(onClose).toHaveBeenCalled()
  })

  it("refuses a short new password", async () => {
    await fill("vieja-clave", "corta", "corta")
    expect(screen.getByText("La contraseña tiene que tener entre 8 y 72 caracteres")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled()
  })

  it("refuses a confirmation that does not match", async () => {
    await fill("vieja-clave", "nueva-clave", "otra-clave")
    expect(screen.getByText("Las contraseñas no coinciden")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled()
  })

  it("needs the current password", async () => {
    await fill("", "nueva-clave", "nueva-clave")
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled()
  })

  it("shows a wrong current password in Spanish and stays open", async () => {
    changePassword.mockRejectedValue(new Error("La contraseña actual es incorrecta"))
    await fill("mala-clave", "nueva-clave", "nueva-clave")
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }))
    expect(await screen.findByText("La contraseña actual es incorrecta")).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Guardar" })).toBeEnabled()
  })
})
