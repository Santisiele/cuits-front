import { TRUST_LEVEL_COLOR_KEYS, TRUST_LEVEL_PALETTE } from "@/lib/trustLevels"
import { cn } from "@/lib/utils"

export function UserColorPicker({
  username,
  color,
  disabled,
  onChange,
}: {
  username: string
  color: string | null
  disabled: boolean
  onChange: (color: string) => void
}) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label={`Color de ${username}`}>
      {TRUST_LEVEL_COLOR_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={color === key}
          aria-label={TRUST_LEVEL_PALETTE[key].label}
          disabled={disabled}
          onClick={() => color !== key && onChange(key)}
          className={cn(
            "h-4 w-4 border border-transparent transition-transform hover:scale-110 disabled:opacity-50",
            TRUST_LEVEL_PALETTE[key].swatch,
            color === key && "ring-2 ring-offset-1 ring-foreground"
          )}
        />
      ))}
    </div>
  )
}
