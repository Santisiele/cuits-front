import { describe, it, expect } from "vitest"
import { screen } from "@testing-library/react"
import { render } from "@/tests/render"
import { ResearchSummary } from "@/components/research/ResearchSummary"

const TEXT = `## 1. Datos fiscales
- Figura como **Persona Física**.
- Fuente: [Cuit Online](https://www.cuitonline.com/detalle/1).

Texto <script>alert("x")</script> suelto.`

describe("ResearchSummary", () => {
  it("shows headings, lists and bold text instead of raw Markdown", () => {
    render(<ResearchSummary text={TEXT} />)
    expect(screen.getByRole("heading", { name: "1. Datos fiscales" })).toBeInTheDocument()
    expect(screen.getAllByRole("listitem")).toHaveLength(2)
    expect(screen.getByText("Persona Física").tagName).toBe("STRONG")
    expect(screen.queryByText(/##|\*\*/)).not.toBeInTheDocument()
  })

  it("opens links in a new tab without giving the page access to the app", () => {
    render(<ResearchSummary text={TEXT} />)
    const link = screen.getByRole("link", { name: "Cuit Online" })
    expect(link).toHaveAttribute("href", "https://www.cuitonline.com/detalle/1")
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("never runs HTML that comes in the text", () => {
    const { container } = render(<ResearchSummary text={TEXT} />)
    expect(container.querySelector("script")).toBeNull()
  })

  it("drops javascript links", () => {
    render(<ResearchSummary text="[click](javascript:alert(1))" />)
    expect(screen.getByText("click").getAttribute("href") ?? "").not.toContain("javascript")
  })
})
