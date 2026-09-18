import { useState } from "react"
import { Popover as PopoverPrimitive } from "radix-ui"
import { Check, ChevronDown, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  matchesOptionSearch,
  toggleAll,
  toggleValue,
  type FilterOption,
} from "@/lib/columnFilters"
import { cn } from "@/lib/utils"

const SEARCH_THRESHOLD = 8

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center border border-input",
        checked && "bg-primary border-primary text-primary-foreground"
      )}
    >
      {checked && <Check className="h-3 w-3" />}
    </span>
  )
}

export type ColumnFilterAppearance = "button" | "header" | "icon"

interface ColumnFilterProps {
  label: string
  options: FilterOption[]
  hidden: string[]
  onChange: (hidden: string[]) => void
  appearance?: ColumnFilterAppearance
}

export function ColumnFilter({
  label,
  options,
  hidden,
  onChange,
  appearance = "header",
}: ColumnFilterProps) {
  const [search, setSearch] = useState("")
  const hiddenSet = new Set(hidden)
  const shownCount = options.filter((option) => !hiddenSet.has(option.value)).length
  const active = shownCount < options.length
  const visible = options.filter((option) => matchesOptionSearch(option, search))
  const allVisibleChecked = visible.every((option) => !hiddenSet.has(option.value))
  const countSuffix = active ? ` (${shownCount}/${options.length})` : ""

  const trigger =
    appearance === "button" ? (
      <Button variant="outline" size="sm">
        {label}
        {countSuffix}
        <ChevronDown className="w-4 h-4 ml-1" />
      </Button>
    ) : appearance === "icon" ? (
      <button
        type="button"
        aria-label={`Filtrar ${label}`}
        className={cn(
          "inline-flex items-center hover:text-foreground transition-colors",
          active && "text-cyan-600 dark:text-cyan-400"
        )}
      >
        {active ? <Filter className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
    ) : (
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1 mx-auto hover:text-foreground transition-colors",
          active && "text-cyan-600 dark:text-cyan-400"
        )}
      >
        {label}
        {countSuffix}
        {active ? <Filter className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
    )

  return (
    <PopoverPrimitive.Root onOpenChange={(open) => !open && setSearch("")}>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          side="bottom"
          sideOffset={4}
          aria-label={`Filtro de ${label}`}
          className="z-50 min-w-56 max-w-80 max-h-96 overflow-y-auto rounded-none border border-border bg-popover p-2 text-popover-foreground shadow-md"
        >
          {options.length > SEARCH_THRESHOLD && (
            <Input
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="h-8 mb-2"
            />
          )}

          {options.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">Sin valores para filtrar</p>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onChange(toggleAll(hidden, visible))}
                disabled={visible.length === 0}
                className="flex w-full items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent/50 transition-colors disabled:opacity-50"
              >
                <CheckBox checked={visible.length > 0 && allVisibleChecked} />
                <span className="font-medium">Seleccionar todos</span>
              </button>

              <div className="my-1 h-px bg-border" />

              {visible.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChange(toggleValue(hidden, option.value))}
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-sm text-left hover:bg-accent/50 transition-colors"
                >
                  <CheckBox checked={!hiddenSet.has(option.value)} />
                  {option.swatch && <span className={cn("h-3 w-3 shrink-0", option.swatch)} />}
                  <span className="truncate">{option.label}</span>
                </button>
              ))}

              {visible.length === 0 && (
                <p className="px-2 py-1.5 text-sm text-muted-foreground">Nada coincide con la búsqueda</p>
              )}
            </>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
