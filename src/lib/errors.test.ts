import { describe, it, expect } from "vitest"
import { translateApiError, getErrorMessage } from "@/lib/errors"

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
