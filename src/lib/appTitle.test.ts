import { describe, it, expect } from "vitest"
import { appTitle } from "@/lib/appTitle"

describe("appTitle", () => {
  it("names the environment when there is one", () => {
    expect(appTitle("testing")).toBe("Buscador de CUIT - TESTING")
    expect(appTitle(" Staging ")).toBe("Buscador de CUIT - STAGING")
  })

  it("stays plain in production", () => {
    expect(appTitle(undefined)).toBe("Buscador de CUIT")
    expect(appTitle("  ")).toBe("Buscador de CUIT")
  })
})
