import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SearchBarProps {
  /** Card title displayed above the search form. */
  title: string
  /** Callback invoked when the user submits a valid search. */
  onSearch: (taxId: string, maxDepth: number) => void
  /** Whether a search is currently in progress. */
  loading: boolean
  /** Input placeholder text. Defaults to "Ingresar CUIT". */
  placeholder?: string
  /**
   * Fills the input from outside — used when a name-search result is picked,
   * so the box shows the CUIT actually being searched instead of whatever the
   * user had typed before.
   */
  value?: string
}

/**
 * Single-CUIT search bar with configurable depth.
 *
 * Handles its own input state and delegates the actual
 * search call to the parent via {@link SearchBarProps.onSearch}.
 */
export function SearchBar({
  title,
  onSearch,
  loading,
  placeholder = "Ingresar CUIT",
  value,
}: SearchBarProps) {
  const [taxId, setTaxId] = useState(value ?? "")
  const [maxDepth, setMaxDepth] = useState("3")

  /**
   * Adopts a new value pushed from the parent without clobbering what the user
   * is typing: it only reassigns when the incoming value actually changed.
   */
  const [adoptedValue, setAdoptedValue] = useState(value)
  if (value !== undefined && value !== adoptedValue) {
    setAdoptedValue(value)
    setTaxId(value)
  }

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault()
    if (!taxId.trim()) return
    onSearch(taxId.trim(), Number(maxDepth))
  }

  const isDisabled = loading || !taxId.trim()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <Input
            value={taxId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaxId(e.target.value)}
            placeholder={placeholder}
            disabled={loading}
          />
          <Input
            value={maxDepth}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxDepth(e.target.value)}
            placeholder="Profundidad"
            type="number"
            min={1}
            max={10}
            className="w-32"
            disabled={loading}
          />
          <Button type="submit" disabled={isDisabled}>
            {loading ? "Buscando..." : "Buscar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}