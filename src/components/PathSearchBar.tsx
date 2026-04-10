import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PathSearchBarProps {
  /** Callback invoked when the user submits a valid path search. */
  onSearch: (from: string, to: string, maxDepth: number) => void
  /** Whether a search is currently in progress. */
  loading: boolean
}

/**
 * Two-CUIT path search bar with configurable depth.
 *
 * Validates that both CUITs are filled in and distinct before
 * calling {@link PathSearchBarProps.onSearch}.
 */
export function PathSearchBar({ onSearch, loading }: PathSearchBarProps) {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [maxDepth, setMaxDepth] = useState("3")

  const fromTrimmed = from.trim()
  const toTrimmed = to.trim()
  const isDisabled = loading || !fromTrimmed || !toTrimmed || fromTrimmed === toTrimmed

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault()
    if (isDisabled) return
    onSearch(fromTrimmed, toTrimmed, Number(maxDepth))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Encontrar relación entre dos CUITs</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <Input
            value={from}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFrom(e.target.value)}
            placeholder="Desde CUIT"
            disabled={loading}
          />
          <Input
            value={to}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTo(e.target.value)}
            placeholder="Hasta CUIT"
            disabled={loading}
          />
          <Input
            value={maxDepth}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxDepth(e.target.value)}
            placeholder="Profundidad"
            type="number"
            min={1}
            max={10}
            className="w-28"
            disabled={loading}
          />
          <Button type="submit" disabled={isDisabled}>
            {loading ? "Buscando..." : "Encontrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}