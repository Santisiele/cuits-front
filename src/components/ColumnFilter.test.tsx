import { describe, it, expect, vi } from "vitest"
import { act, useState } from "react"
import { screen, fireEvent } from "@testing-library/react"
import { render } from "@/tests/render"
import { ColumnFilter, type ColumnFilterAppearance } from "@/components/ColumnFilter"
import type { FilterOption } from "@/lib/columnFilters"

function opts(...labels: string[]): FilterOption[] {
  return labels.map((label) => ({ value: label, label }))
}

function Harness({
  options,
  initial = [],
  appearance,
  onChange,
}: {
  options: FilterOption[]
  initial?: string[]
  appearance?: ColumnFilterAppearance
  onChange?: (hidden: string[]) => void
}) {
  const [hidden, setHidden] = useState(initial)
  return (
    <>
      <ColumnFilter
        label="Fuentes"
        options={options}
        hidden={hidden}
        appearance={appearance}
        onChange={(next) => {
          setHidden(next)
          onChange?.(next)
        }}
      />
      <output data-testid="hidden">{hidden.join("|")}</output>
    </>
  )
}

function click(element: Element): void {
  act(() => {
    fireEvent.click(element)
  })
}

function openFilter(): void {
  click(screen.getByRole("button", { name: /Fuentes/ }))
}

function option(label: string): HTMLElement {
  return screen.getByRole("button", { name: label })
}

function hiddenNow(): string {
  return screen.getByTestId("hidden").textContent ?? ""
}

describe("ColumnFilter", () => {
  it("opens a list with every value when the header is touched", () => {
    render(<Harness options={opts("Bolsa", "Clientes CRM")} />)
    openFilter()
    expect(option("Bolsa")).toBeInTheDocument()
    expect(option("Clientes CRM")).toBeInTheDocument()
  })

  it("unticking a value hides it", () => {
    render(<Harness options={opts("Bolsa", "Clientes CRM")} />)
    openFilter()
    click(option("Bolsa"))
    expect(hiddenNow()).toBe("Bolsa")
  })

  it("ticking it again shows it", () => {
    render(<Harness options={opts("Bolsa", "Clientes CRM")} initial={["Bolsa"]} />)
    openFilter()
    click(option("Bolsa"))
    expect(hiddenNow()).toBe("")
  })

  it("select all unticks everything, then ticks it back", () => {
    render(<Harness options={opts("A", "B")} />)
    openFilter()
    click(option("Seleccionar todos"))
    expect(hiddenNow().split("|").sort()).toEqual(["A", "B"])
    click(option("Seleccionar todos"))
    expect(hiddenNow()).toBe("")
  })

  it("says how many values are showing once something is off", () => {
    render(<Harness options={opts("A", "B", "C")} initial={["A"]} />)
    expect(screen.getByRole("button", { name: /Fuentes \(2\/3\)/ })).toBeInTheDocument()
  })

  it("says nothing about counts while every value is on", () => {
    render(<Harness options={opts("A", "B", "C")} />)
    expect(screen.queryByText(/\(\d\/\d\)/)).not.toBeInTheDocument()
  })

  it("offers a search once the list gets long", () => {
    render(<Harness options={opts("A", "B", "C", "D", "E", "F", "G", "H", "I")} />)
    openFilter()
    expect(screen.getByPlaceholderText("Buscar...")).toBeInTheDocument()
  })

  it("does not clutter a short list with a search", () => {
    render(<Harness options={opts("A", "B")} />)
    openFilter()
    expect(screen.queryByPlaceholderText("Buscar...")).not.toBeInTheDocument()
  })

  it("narrows the list with the search", () => {
    const many = opts("FINARES S.A.", "MARIAS CAPITAL SA", "C", "D", "E", "F", "G", "H", "I")
    render(<Harness options={many} />)
    openFilter()
    act(() => {
      fireEvent.change(screen.getByPlaceholderText("Buscar..."), { target: { value: "finar" } })
    })
    expect(option("FINARES S.A.")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "MARIAS CAPITAL SA" })).not.toBeInTheDocument()
  })

  it("makes select all act on what the search is showing only", () => {
    const many = opts("FINARES S.A.", "MARIAS CAPITAL SA", "C", "D", "E", "F", "G", "H", "I")
    render(<Harness options={many} />)
    openFilter()
    act(() => {
      fireEvent.change(screen.getByPlaceholderText("Buscar..."), { target: { value: "finar" } })
    })
    click(option("Seleccionar todos"))
    expect(hiddenNow()).toBe("FINARES S.A.")
  })

  it("says so when the search matches nothing", () => {
    render(<Harness options={opts("A", "B", "C", "D", "E", "F", "G", "H", "I")} />)
    openFilter()
    act(() => {
      fireEvent.change(screen.getByPlaceholderText("Buscar..."), { target: { value: "zzz" } })
    })
    expect(screen.getByText("Nada coincide con la búsqueda")).toBeInTheDocument()
  })

  it("can sit beside a sort button as a bare icon", () => {
    const onChange = vi.fn()
    render(<Harness options={opts("Bolsa")} appearance="icon" onChange={onChange} />)
    click(screen.getByRole("button", { name: "Filtrar Fuentes" }))
    click(option("Bolsa"))
    expect(onChange).toHaveBeenCalledWith(["Bolsa"])
  })

  it("says there is nothing to filter when there are no values", () => {
    render(<Harness options={[]} />)
    openFilter()
    expect(screen.getByText("Sin valores para filtrar")).toBeInTheDocument()
  })
})
