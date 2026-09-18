import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen } from "@testing-library/react"
import { render } from "@/tests/render"
import userEvent from "@testing-library/user-event"
import type { CuitSearchResponse } from "@/types"

interface FakeQuery {
  data?: CuitSearchResponse
  error?: Error
  isFetching: boolean
}

const answers = new Map<string, FakeQuery>()

vi.mock("@/hooks/useGraphQueries", () => ({
  useCuitSearches: (taxIds: string[]) =>
    taxIds.map((taxId) => answers.get(taxId) ?? { isFetching: false }),
}))

vi.mock("@/components/GraphView", () => ({
  GraphView: ({ cuitResult }: { cuitResult: CuitSearchResponse }) => (
    <div data-testid="graph-view">{cuitResult.cuit}</div>
  ),
}))

const { MultiSearch } = await import("@/components/MultiSearch")

const A = "20461235787"
const B = "30707505024"

function found(cuit: string, businessName: string): FakeQuery {
  return {
    isFetching: false,
    data: {
      cuit,
      found: true,
      results: [{ cuit, source: "neo4j", file: "", data: { businessName, inMyBase: true } }],
    },
  }
}

async function search(text: string) {
  const user = userEvent.setup()
  await user.type(screen.getByPlaceholderText(/Un CUIT por línea/i), text)
  await user.click(screen.getByRole("button", { name: "Buscar" }))
  return user
}

describe("MultiSearch", () => {
  beforeEach(() => {
    answers.clear()
    render(<MultiSearch />)
  })

  describe("the box", () => {
    it("counts the CUITs it can read", async () => {
      const user = userEvent.setup()
      await user.type(screen.getByPlaceholderText(/Un CUIT por línea/i), `${A}\n${B}`)
      expect(screen.getByText("2 CUITs para buscar")).toBeInTheDocument()
    })

    it("uses the singular for one", async () => {
      const user = userEvent.setup()
      await user.type(screen.getByPlaceholderText(/Un CUIT por línea/i), A)
      expect(screen.getByText("1 CUIT para buscar")).toBeInTheDocument()
    })

    it("names what it could not read", async () => {
      const user = userEvent.setup()
      await user.type(screen.getByPlaceholderText(/Un CUIT por línea/i), `${A}\nhola`)
      expect(screen.getByText(/No son CUITs de 11 dígitos: hola/)).toBeInTheDocument()
    })

    it("will not search with nothing valid in the box", async () => {
      const user = userEvent.setup()
      await user.type(screen.getByPlaceholderText(/Un CUIT por línea/i), "hola")
      expect(screen.getByRole("button", { name: "Buscar" })).toBeDisabled()
    })

    it("warns when the list runs past the cap", async () => {
      const many = Array.from({ length: 22 }, (_, i) => `20461235${String(i).padStart(3, "0")}`)
      const user = userEvent.setup()
      await user.type(screen.getByPlaceholderText(/Un CUIT por línea/i), many.join(" "))
      expect(screen.getByText(/Se buscan los primeros 20/)).toBeInTheDocument()
    })
  })

  describe("the panels", () => {
    it("shows one per CUIT, with the CUIT formatted", async () => {
      answers.set(A, found(A, "Alguien"))
      answers.set(B, found(B, "Arteplas SA"))
      await search(`${A}\n${B}`)
      expect(screen.getByText("20-46123578-7")).toBeInTheDocument()
      expect(screen.getByText("30-70750502-4")).toBeInTheDocument()
    })

    it("puts the business name beside the CUIT", async () => {
      answers.set(A, found(A, "Alguien"))
      await search(A)
      expect(screen.getByText("Alguien")).toBeInTheDocument()
    })

    it("opens the only panel when a single CUIT was searched", async () => {
      answers.set(A, found(A, "Alguien"))
      await search(A)
      expect(screen.getByTestId("graph-view")).toBeInTheDocument()
    })

    it("keeps every panel shut when several were searched", async () => {
      answers.set(A, found(A, "Alguien"))
      answers.set(B, found(B, "Arteplas SA"))
      await search(`${A}\n${B}`)
      expect(screen.queryByTestId("graph-view")).not.toBeInTheDocument()
    })

    it("opens them all on demand", async () => {
      answers.set(A, found(A, "Alguien"))
      answers.set(B, found(B, "Arteplas SA"))
      const user = await search(`${A}\n${B}`)
      await user.click(screen.getByRole("button", { name: "Abrir todos" }))
      expect(screen.getAllByTestId("graph-view")).toHaveLength(2)
    })

    it("shuts them all again", async () => {
      answers.set(A, found(A, "Alguien"))
      const user = await search(A)
      await user.click(screen.getByRole("button", { name: "Cerrar todos" }))
      expect(screen.queryByTestId("graph-view")).not.toBeInTheDocument()
    })

    it("searches a repeated CUIT once", async () => {
      answers.set(A, found(A, "Alguien"))
      await search(`${A}\n${A}`)
      expect(screen.getAllByText("20-46123578-7")).toHaveLength(1)
    })
  })

  describe("when a CUIT answers nothing", () => {
    it("says so instead of leaving the row blank", async () => {
      answers.set(A, { isFetching: false, data: { cuit: A, found: false, results: [] } })
      await search(A)
      expect(screen.getByText("Sin resultados")).toBeInTheDocument()
    })

    it("marks a failed lookup without losing the other panels", async () => {
      answers.set(A, { isFetching: false, error: new Error("Se cayó") })
      answers.set(B, found(B, "Arteplas SA"))
      await search(`${A}\n${B}`)
      expect(screen.getByText("Error")).toBeInTheDocument()
      expect(screen.getByText("Arteplas SA")).toBeInTheDocument()
    })

    it("shows the reason inside the panel once it is opened", async () => {
      answers.set(A, { isFetching: false, error: new Error("Se cayó") })
      answers.set(B, found(B, "Arteplas SA"))
      const user = await search(`${A}
${B}`)
      expect(screen.queryByText("Se cayó")).not.toBeInTheDocument()
      await user.click(screen.getByText("20-46123578-7"))
      expect(screen.getByText("Se cayó")).toBeInTheDocument()
    })

    it("counts how many came back with relations", async () => {
      answers.set(A, found(A, "Alguien"))
      answers.set(B, { isFetching: false, data: { cuit: B, found: false, results: [] } })
      await search(`${A}\n${B}`)
      expect(screen.getByText("1 de 2 con relaciones")).toBeInTheDocument()
    })
  })
})
