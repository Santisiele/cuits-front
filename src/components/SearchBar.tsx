import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"

interface SearchBarProps {
  onSearch: (taxId: string, maxDepth: number) => void
  loading: boolean
  title: string
  placeholder?: string
}

/**
 * Single CUIT search bar component
 */
export function SearchBar({ onSearch, loading, title, placeholder = "Enter Tax ID" }: SearchBarProps) {
  const [taxId, setTaxId] = useState("")
  const [maxDepth, setMaxDepth] = useState("3")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!taxId.trim()) return
    onSearch(taxId.trim(), Number(maxDepth))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={taxId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaxId(e.target.value)}
            placeholder={placeholder}
            disabled={loading}
          />
          <Input
            value={maxDepth}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxDepth(e.target.value)}
            placeholder="Max depth"
            type="number"
            min={1}
            max={10}
            className="w-28"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !taxId.trim()}>
            {loading ? "Searching..." : "Search"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}