import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"

interface PathSearchBarProps {
  onSearch: (from: string, to: string, maxDepth: number) => void
  loading: boolean
}

/**
 * Two-CUIT path search bar component
 */
export function PathSearchBar({ onSearch, loading }: PathSearchBarProps) {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [maxDepth, setMaxDepth] = useState("3")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!from.trim() || !to.trim()) return
    if (from.trim() === to.trim()) return
    onSearch(from.trim(), to.trim(), Number(maxDepth))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Find Path Between Two Tax IDs</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={from}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFrom(e.target.value)}
            placeholder="From Tax ID"
            disabled={loading}
          />
          <Input
            value={to}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTo(e.target.value)}
            placeholder="To Tax ID"
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
          <Button
            type="submit"
            disabled={loading || !from.trim() || !to.trim() || from.trim() === to.trim()}
          >
            {loading ? "Searching..." : "Find Path"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}