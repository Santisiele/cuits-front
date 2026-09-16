import { Popover as PopoverPrimitive } from "radix-ui"
import { Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTrustLevelsQuery } from "@/hooks/useTrustLevels"
import { NO_LEVEL_LABEL, NO_LEVEL_VALUE, paletteFor } from "@/lib/trustLevels"
import { cn } from "@/lib/utils"

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

interface TrustLevelFilterProps {
  hidden: number[]
  onChange: (hidden: number[]) => void
}

export function TrustLevelFilter({ hidden, onChange }: TrustLevelFilterProps) {
  const { data: levels = [] } = useTrustLevelsQuery()

  const options = [
    { value: NO_LEVEL_VALUE, label: NO_LEVEL_LABEL, color: null },
    ...levels.map((level) => ({ value: level.value, label: level.label, color: level.color })),
  ]

  const hiddenSet = new Set(hidden)
  const allChecked = hidden.length === 0
  const shownCount = options.length - options.filter((o) => hiddenSet.has(o.value)).length

  function toggle(value: number): void {
    const next = new Set(hiddenSet)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    onChange([...next])
  }

  function toggleAll(): void {
    onChange(allChecked ? options.map((o) => o.value) : [])
  }

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <Button variant="outline" size="sm">
          Niveles
          {!allChecked && ` (${shownCount}/${options.length})`}
          <ChevronDown className="w-4 h-4 ml-1" />
        </Button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          side="bottom"
          sideOffset={4}
          className="z-50 min-w-56 max-h-80 overflow-y-auto rounded-none border border-border bg-popover p-2 text-popover-foreground shadow-md"
        >
          <button
            type="button"
            onClick={toggleAll}
            className="flex w-full items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent/50 transition-colors"
          >
            <CheckBox checked={allChecked} />
            <span className="font-medium">Seleccionar todos</span>
          </button>

          <div className="my-1 h-px bg-border" />

          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => toggle(option.value)}
              className="flex w-full items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent/50 transition-colors"
            >
              <CheckBox checked={!hiddenSet.has(option.value)} />
              {option.color && (
                <span className={cn("h-3 w-3 shrink-0", paletteFor(option.color).swatch)} />
              )}
              <span className="truncate">{option.label}</span>
            </button>
          ))}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
