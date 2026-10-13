import { describe, it, expect } from "vitest"
import { translateApiError, translateApiFailure, getErrorMessage } from "@/lib/errors"

describe("translateApiError", () => {
  it("translates the refusal to list level 0", () => {
    expect(translateApiError("There is no list for level 0, which stands for having no level")).toBe(
      "El nivel 0 es la ausencia de nivel: no tiene lista de CUITs"
    )
  })

  it("does not let the edit-or-delete message swallow the listing one", () => {
    expect(translateApiError("There is no list for level 0, which stands for having no level")).not.toContain(
      "editar ni borrar"
    )
  })

  it("still gives the edit-or-delete message its own translation", () => {
    expect(translateApiError("Level 0 stands for having no level and cannot be edited or deleted")).toBe(
      "El nivel 0 es la ausencia de nivel: no se puede editar ni borrar"
    )
  })

  it("translates a level that does not exist", () => {
    expect(translateApiError("That trust level does not exist")).toBe("Ese nivel no existe")
  })

  it("translates a level that is not a whole number", () => {
    expect(translateApiError("The level must be a whole number")).toBe("El nivel tiene que ser un número entero")
  })

  it("translates the inverted birthday range", () => {
    expect(translateApiError("The end date cannot be earlier than the start date.")).toBe(
      "La fecha de fin no puede ser anterior a la de inicio"
    )
  })

  it("passes an unknown message through untouched", () => {
    expect(translateApiError("Something new")).toBe("Something new")
  })
})

describe("getErrorMessage", () => {
  it("reads the message of an error", () => {
    expect(getErrorMessage(new Error("se cayó"))).toBe("se cayó")
  })

  it("falls back for anything that is not an error", () => {
    expect(getErrorMessage("texto suelto")).toBe("Error desconocido")
  })

  it("uses the fallback it is given", () => {
    expect(getErrorMessage(null, "otra cosa")).toBe("otra cosa")
  })
})

describe("translateApiFailure", () => {
  it("translates by the error code when it knows it", () => {
    expect(translateApiFailure("username_taken", "That username is already taken")).toBe("Ese usuario ya existe")
  })

  it("does not let the loose not found match swallow a missing user", () => {
    expect(translateApiFailure("user_not_found", "User not found")).toBe("El usuario no existe")
  })

  it("translates a refusal to a member", () => {
    expect(translateApiFailure("forbidden", "Only an admin can do this")).toBe("No tenés permiso para esto")
  })

  it("falls back to the message for an unknown code", () => {
    expect(translateApiFailure("level_not_found", "That trust level does not exist")).toBe("Ese nivel no existe")
  })

  it("falls back to the message when there is no code", () => {
    expect(translateApiFailure(undefined, "Invalid password")).toBe("Contraseña incorrecta")
  })

  it("translates the refusals that protect the creator", () => {
    expect(translateApiFailure("creator_only", "Only the creator can do this")).toBe("Solo el creador puede hacer esto")
    expect(translateApiFailure("cannot_change_creator", "The creator cannot be changed")).toBe(
      "El creador no se puede modificar"
    )
  })

  it("ignores codes inherited from Object", () => {
    expect(translateApiFailure("toString", "Something new")).toBe("Something new")
  })
})
